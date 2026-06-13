import React, { useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { toast } from '@/lib/toast';
import { meetingApi, AgendaItemFeedbackResponse } from '../services/meeting.api';

interface FeedbackChatSectionProps {
  agendaItemId: string;
  feedbacks?: AgendaItemFeedbackResponse[];
  feedbackType: 'INSTRUCTION' | 'RESPONSE';
  onSuccess?: (updatedFeedbacks: AgendaItemFeedbackResponse[]) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export const FeedbackChatSection: React.FC<FeedbackChatSectionProps> = ({
  agendaItemId,
  feedbacks = [],
  feedbackType,
  onSuccess,
  placeholder = "Nhập ý kiến phản hồi...",
  disabled = false,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await meetingApi.addFeedback(agendaItemId, chatInput.trim(), feedbackType);
      if (res.success) {
        setChatInput('');
        toast.success("Đã gửi ý kiến thành công");
        if (onSuccess) {
          await onSuccess(res.data?.feedbacks || []);
        }
      } else {
        toast.error("Lỗi", res.message || "Không thể gửi ý kiến.");
      }
    } catch (error: any) {
      console.error("Error sending feedback:", error);
      toast.error("Lỗi kết nối", error.message || "Đã xảy ra lỗi khi gửi ý kiến.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
        Lịch sử trao đổi / Ý kiến phản hồi
      </span>
      <div className="border border-gray-100 rounded-xl bg-gray-50/50 p-3 space-y-3">
        {feedbacks && feedbacks.length > 0 ? (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {feedbacks.map((fb) => {
              const isInstruction = fb.type === 'INSTRUCTION';
              const isResponse = fb.type === 'RESPONSE';
              return (
                <div
                  key={fb.id}
                  className={`p-2.5 rounded-xl border text-sm transition-all duration-200 ${
                    isInstruction
                      ? 'bg-blue-50/70 border-blue-100 text-blue-900'
                      : isResponse
                      ? 'bg-emerald-50/70 border-emerald-100 text-emerald-900'
                      : 'bg-red-50/70 border-red-100 text-red-900'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 text-xs font-medium opacity-80">
                    <span>
                      {fb.authorName || (isInstruction ? 'Người duyệt' : isResponse ? 'Người chuẩn bị' : 'Người duyệt')}
                    </span>
                    <span>
                      {new Date(fb.createdAt).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-[13px]">
                    <span className="font-semibold block mb-0.5 text-xs opacity-75">
                      {isInstruction
                        ? '📌 Hướng dẫn chuẩn bị:'
                        : isResponse
                        ? '📤 Phản hồi từ người chuẩn bị:'
                        : '⚠️ Lý do từ chối:'}
                    </span>
                    {fb.content}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">Chưa có lịch sử trao đổi.</p>
        )}

        {/* Chat Input */}
        {!disabled && (
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              placeholder={placeholder}
              className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
            {chatInput.trim().length > 0 && (
              <Button
                type="button"
                onClick={handleSendChat}
                disabled={isSending}
                className="bg-[#C8102E] hover:bg-[#A90F14] text-white rounded-xl text-xs font-semibold px-4 animate-in fade-in slide-in-from-right-1 duration-200"
              >
                {isSending ? "Đang gửi..." : "Gửi"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
