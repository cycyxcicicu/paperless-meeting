import { api } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/api/types';

export interface AssistantChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatRequest {
  question: string;
  history?: AssistantChatHistoryMessage[];
}

export interface AssistantChatResponse {
  answer: string;
  agentsUsed: string[];
  offTopic: boolean;
  tookMs: number;
}

export interface AssistantMessageResponse {
  role: 'user' | 'assistant';
  content: string;
  agentsUsed: string[];
  offTopic: boolean;
  createdAt: string;
}

export interface AssistantHistoryPageResponse {
  messages: AssistantMessageResponse[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface AssistantStreamDoneMeta {
  agentsUsed: string[];
  offTopic: boolean;
  tookMs: number;
}

export interface AssistantStreamCallbacks {
  onDelta: (text: string) => void;
  onDone: (meta: AssistantStreamDoneMeta) => void;
  onError: (message: string) => void;
}

// Endpoint streaming dùng fetch() thô (không qua axios instance `api`) vì cần đọc
// response.body dạng ReadableStream - axios trong trình duyệt không hỗ trợ việc này,
// và interceptor của `api` giả định luôn là JSON, không phải SSE.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function parseSseEvent(raw: string, callbacks: AssistantStreamCallbacks) {
  let eventName = 'message';
  let dataLine = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLine += line.slice(5).trim();
    }
  }
  if (!dataLine) return;

  try {
    const payload = JSON.parse(dataLine);
    // delta/error được backend bọc trong { text }/{ message } (không gửi String trần)
    // để Jackson escape đúng ký tự xuống dòng/dấu ngoặc kép trong câu trả lời.
    if (eventName === 'delta') callbacks.onDelta((payload as { text: string }).text);
    else if (eventName === 'done') callbacks.onDone(payload as AssistantStreamDoneMeta);
    else if (eventName === 'error') callbacks.onError((payload as { message: string }).message);
  } catch (err) {
    console.error('Không parse được sự kiện SSE từ trợ lý AI:', raw, err);
  }
}

export const assistantApi = {
  chat: async (meetingId: string, data: AssistantChatRequest): Promise<ApiResponse<AssistantChatResponse>> => {
    return api.post(`/meetings/${meetingId}/assistant/chat`, data);
  },

  /**
   * Gọi API streaming (SSE): callbacks.onDelta được gọi liên tục khi có chữ mới,
   * onDone khi trợ lý trả lời xong (kèm agentsUsed/offTopic/tookMs), onError nếu lỗi.
   * Truyền signal từ AbortController để có thể dừng giữa chừng (nút Dừng) - phần chữ
   * đã nhận được trước đó vẫn giữ nguyên, backend cũng đã lưu lại phần đó vào lịch sử.
   */
  chatStream: async (
    meetingId: string,
    data: AssistantChatRequest,
    callbacks: AssistantStreamCallbacks,
    signal: AbortSignal
  ): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/assistant/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal,
    });

    if (!response.ok || !response.body) {
      const errBody = await response.json().catch(() => null);
      callbacks.onError(errBody?.message || 'Không thể kết nối tới trợ lý AI.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIndex;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        parseSseEvent(rawEvent, callbacks);
      }
    }
  },

  /**
   * Phân trang theo cursor (before), không theo số trang: bỏ trống 'before' để lấy
   * 20 tin mới nhất; truyền 'before' = nextCursor của lần gọi trước để lấy 20 tin cũ
   * hơn tiếp theo. Không dùng số trang để tránh lệch dữ liệu khi có tin nhắn mới phát
   * sinh trong lúc đang cuộn xem lịch sử cũ.
   */
  getHistory: async (meetingId: string, before?: string): Promise<ApiResponse<AssistantHistoryPageResponse>> => {
    return api.get(`/meetings/${meetingId}/assistant/history`, {
      params: before ? { before } : undefined,
    });
  },
};
