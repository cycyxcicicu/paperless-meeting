import { useCallback, useRef, useState } from 'react';
import { toast } from '@/lib/toast';
import { assistantApi, AssistantChatHistoryMessage, AssistantMessageResponse } from '../services/assistant.api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentsUsed?: string[];
  offTopic?: boolean;
}

const MAX_HISTORY = 6;

function toChatMessage(m: AssistantMessageResponse): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: m.role,
    content: m.content,
    agentsUsed: m.agentsUsed,
    offTopic: m.offTopic,
  };
}

export function useAssistantChat(meetingId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const hasLoadedRef = useRef(false);
  // Con trỏ (cursor) = thời điểm tin nhắn cũ nhất đã tải. Dùng ref (không phải state)
  // vì chỉ cần đọc/ghi trong các callback, không cần re-render khi thay đổi.
  const cursorRef = useRef<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!meetingId || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setLoadingHistory(true);
    try {
      const res = await assistantApi.getHistory(meetingId);
      if (res.success && res.data) {
        setMessages(res.data.messages.map(toChatMessage));
        setHasMoreHistory(res.data.hasMore);
        cursorRef.current = res.data.nextCursor;
      }
    } catch (err) {
      console.error('Error loading assistant chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [meetingId]);

  // Gọi khi người dùng cuộn lên gần đầu khung chat - tải thêm 20 tin cũ hơn, neo theo
  // cursorRef (thời điểm) chứ không theo số trang, nên không bị lệch dữ liệu dù đang
  // có tin nhắn mới liên tục được gửi/lưu ở phía cuối cuộc trò chuyện.
  const loadMoreOlder = useCallback(async () => {
    if (!meetingId || !hasMoreHistory || loadingMoreHistory || !cursorRef.current) return;
    setLoadingMoreHistory(true);
    try {
      const res = await assistantApi.getHistory(meetingId, cursorRef.current);
      if (res.success && res.data) {
        setMessages((prev) => [...res.data!.messages.map(toChatMessage), ...prev]);
        setHasMoreHistory(res.data.hasMore);
        cursorRef.current = res.data.nextCursor;
      }
    } catch (err) {
      console.error('Error loading more assistant chat history:', err);
    } finally {
      setLoadingMoreHistory(false);
    }
  }, [meetingId, hasMoreHistory, loadingMoreHistory]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!meetingId || !trimmed || sending) return;

      // Lọc bỏ tin nhắn rỗng trước khi gửi làm lịch sử - phòng trường hợp 1 lượt trước đó
      // bị dừng/lỗi trước khi có chữ nào, để lại bong bóng rỗng (content: '') vẫn còn
      // trong state. Backend chặn content rỗng bằng @NotBlank, nếu lọt vào sẽ làm hỏng
      // luôn cả câu hỏi mới này.
      const history: AssistantChatHistoryMessage[] = messages
        .slice(-MAX_HISTORY)
        .filter((m) => m.content.trim() !== '')
        .map((m) => ({ role: m.role, content: m.content }));

      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed };
      const assistantMessageId = crypto.randomUUID();
      // Bong bóng trả lời rỗng, hiện trước rồi lớn dần theo từng đoạn chữ nhận được -
      // tạo hiệu ứng trả lời từ từ (streaming thật, không phải giả lập).
      const assistantPlaceholder: ChatMessage = { id: assistantMessageId, role: 'assistant', content: '' };
      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setSending(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await assistantApi.chatStream(
          meetingId,
          { question: trimmed, history },
          {
            onDelta: (text) => {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMessageId ? { ...m, content: m.content + text } : m))
              );
            },
            onDone: (meta) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, agentsUsed: meta.agentsUsed, offTopic: meta.offTopic }
                    : m
                )
              );
            },
            onError: (message) => {
              const errorText = message || 'Không thể lấy câu trả lời từ trợ lý AI.';
              toast.error('Lỗi', errorText);
              // Ghi luôn lỗi vào bong bóng trả lời thay vì để rỗng - vừa để người dùng
              // thấy rõ trong khung chat, vừa tránh còn sót nội dung rỗng trong lịch sử.
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMessageId ? { ...m, content: errorText } : m))
              );
            },
          },
          controller.signal
        );
      } catch (err: any) {
        // AbortError = người dùng tự bấm Dừng: giữ nguyên phần chữ đã nhận, không báo lỗi.
        if (err?.name !== 'AbortError') {
          toast.error('Lỗi', 'Trợ lý AI đang gặp sự cố, vui lòng thử lại sau.');
        }
      } finally {
        setSending(false);
        abortControllerRef.current = null;
        // Nếu bị dừng/lỗi TRƯỚC KHI nhận được chữ nào, bong bóng vẫn đang rỗng - gán
        // placeholder rõ ràng, không bao giờ để lại content rỗng trong state (nguồn gây
        // lỗi @NotBlank ở lượt hỏi tiếp theo).
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId && m.content === ''
              ? { ...m, content: '(Không nhận được phản hồi - đã dừng hoặc có lỗi xảy ra)' }
              : m
          )
        );
      }
    },
    [meetingId, messages, sending]
  );

  const stopGenerating = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => setMessages([]), []);

  return {
    messages,
    sending,
    sendMessage,
    stopGenerating,
    reset,
    loadHistory,
    loadingHistory,
    loadMoreOlder,
    loadingMoreHistory,
    hasMoreHistory,
  };
}
