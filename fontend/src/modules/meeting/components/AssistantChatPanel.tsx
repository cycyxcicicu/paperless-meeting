import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, Sparkles, Loader2, Send, Square, AlertCircle } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Textarea } from '@/common/components/ui/textarea';
import { cn } from '@/common/utils/cn';
import { useAssistantChat } from '../hooks/useAssistantChat';
import { AgentActivityBadge } from './AgentActivityBadge';

// Ngưỡng cuộn lên để tải thêm lịch sử cũ hơn - cùng công thức 80% đã dùng cho lazy
// load ở trang chủ (fontend/src/app/pages/HomePage.tsx), chỉ đảo chiều: ở đây kiểm
// tra đã cuộn LÊN gần đầu danh sách (còn lại 20% quãng đường cuộn phía trên).
const SCROLL_UP_LOAD_MORE_THRESHOLD = 0.2;

interface AssistantChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle: string;
}

const SUGGESTED_QUESTIONS = [
  'Cuộc họp này diễn ra ở đâu, lúc nào?',
  'Ai vắng mặt hoặc đến muộn?',
  'Nội dung 1 có những tài liệu gì?',
  'Kết quả biểu quyết gần nhất thế nào?',
];

export const AssistantChatPanel: React.FC<AssistantChatPanelProps> = ({
  isOpen,
  onClose,
  meetingId,
  meetingTitle,
}) => {
  const {
    messages,
    sending,
    sendMessage,
    stopGenerating,
    loadHistory,
    loadingHistory,
    loadMoreOlder,
    loadingMoreHistory,
    hasMoreHistory,
  } = useAssistantChat(meetingId);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  // Ghi lại chiều cao nội dung trước khi chèn thêm tin nhắn cũ ở đầu danh sách, để
  // sau khi DOM cập nhật có thể giữ nguyên vị trí đang xem (không bị giật/nhảy).
  const prevScrollHeightRef = useRef(0);
  const isPrependingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (isPrependingRef.current) {
      // Vừa chèn thêm tin nhắn cũ ở đầu danh sách: giữ nguyên vị trí đang xem thay vì
      // để trình duyệt tự kéo lên đầu.
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      isPrependingRef.current = false;
    } else {
      // Trường hợp bình thường (mở khung chat lần đầu, gửi câu hỏi mới, nhận câu trả
      // lời mới): luôn cuộn xuống cuối để thấy tin nhắn mới nhất.
      container.scrollTop = container.scrollHeight;
      
      const timeoutId = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, sending, isOpen]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim() || sending) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (loadingMoreHistory || !hasMoreHistory) return;
    const container = e.currentTarget;
    const maxScrollTop = container.scrollHeight - container.clientHeight;
    if (maxScrollTop <= 0) return;
    if (container.scrollTop <= SCROLL_UP_LOAD_MORE_THRESHOLD * maxScrollTop) {
      prevScrollHeightRef.current = container.scrollHeight;
      isPrependingRef.current = true;
      loadMoreOlder();
    }
  };

  return (
    <div className="fixed right-6 bottom-6 w-[440px] h-[580px] max-h-[85vh] z-50 bg-[#F8FAFC] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-50 text-[#C8102E]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">Trợ lý AI cuộc họp</h3>
            <p className="text-xs text-gray-500 font-medium truncate max-w-[200px]">{meetingTitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Message list */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-4">
        {loadingMoreHistory && (
          <div className="flex justify-center py-1">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}

        {loadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#C8102E]" />
            <span className="text-xs text-gray-500 font-medium">Đang tải lịch sử trò chuyện...</span>
          </div>
        )}

        {!loadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="p-3 rounded-2xl bg-red-50 text-[#C8102E]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Hỏi tôi bất cứ điều gì về cuộc họp này</p>
              <p className="text-xs text-gray-500 mt-1">
                Thông tin họp, tài liệu, biểu quyết... chỉ trong phạm vi cuộc họp đang mở.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs font-medium text-gray-600 bg-white border border-gray-150 rounded-2xl px-4 py-2.5 hover:border-red-200 hover:text-[#C8102E] transition-colors shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, index) => {
          const isStreamingThisMessage = sending && index === messages.length - 1 && m.role === 'assistant';
          return (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] min-w-0 break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                  m.role === 'user'
                    ? 'bg-[#C8102E] text-white rounded-br-md'
                    : m.offTopic
                    ? 'bg-amber-50 border border-amber-150 text-amber-800 rounded-bl-md'
                    : 'bg-white border border-gray-150 text-gray-800 rounded-bl-md'
                )}
              >
                {m.offTopic && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 mb-1">
                    <AlertCircle className="h-3 w-3" />
                    Ngoài phạm vi hỗ trợ
                  </div>
                )}
                {isStreamingThisMessage && m.content === '' ? (
                  <span className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C8102E]" />
                    Trợ lý đang tra cứu dữ liệu...
                  </span>
                ) : (
                  <p className={cn("whitespace-pre-line font-medium", m.role === 'user' ? 'text-white' : 'text-gray-800')}>
                    {m.content}
                    {isStreamingThisMessage && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 -mb-0.5 bg-[#C8102E]/70 animate-pulse" />
                    )}
                  </p>
                )}
                {m.role === 'assistant' && <AgentActivityBadge agentsUsed={m.agentsUsed} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input footer */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi về cuộc họp này..."
            className="flex-1 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] text-sm px-5 h-11 bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-400 text-gray-800"
          />
          {sending ? (
            <Button
              type="button"
              variant="primary"
              className="bg-gray-700 hover:bg-gray-800 rounded-full h-11 w-11 p-0 shrink-0 flex items-center justify-center"
              onClick={stopGenerating}
              title="Dừng trả lời"
            >
              <Square className="h-3.5 w-3.5 fill-white" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="bg-[#C8102E] hover:bg-[#a80d26] rounded-full h-11 w-11 p-0 shrink-0 flex items-center justify-center"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
