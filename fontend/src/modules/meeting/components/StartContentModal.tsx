import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/common/components/ui/button';

interface MeetingContent {
  id: string | number;
  title: string;
  description: string;
}

interface StartContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: MeetingContent | null;
  onConfirm: (contentId: string | number) => void;
}

export const StartContentModal: React.FC<StartContentModalProps> = ({
  isOpen,
  onClose,
  content,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (content) {
      onConfirm(content.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg btn-primary text-gray-900">
            Xác nhận bắt đầu nội dung
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {content ? (
            <>
              {/* Content Title */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm btn-primary text-gray-900 mb-1">
                  {content.title}
                </p>
                <p className="text-sm text-gray-600">{content.description}</p>
              </div>

              {/* Warning Message */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 leading-relaxed">
                  Bắt đầu nội dung này sẽ kết thúc những nội dung đang họp khác, bạn
                  có đồng ý không?
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Không tìm thấy thông tin nội dung</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-[#C8102E] hover:bg-[#a80d26]"
          >
            Đồng ý
          </Button>
        </div>
      </div>
    </div>
  );
};

export type { MeetingContent };
