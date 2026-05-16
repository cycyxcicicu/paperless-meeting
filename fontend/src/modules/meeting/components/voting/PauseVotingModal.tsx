import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/common/components/ui/button';

interface PauseVotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  issueTitle: string;
}

export const PauseVotingModal: React.FC<PauseVotingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  issueTitle,
}) => {
  if (!isOpen) return null;

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
            Xác nhận tạm dừng biểu quyết
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700">
            Bạn có muốn phát lệnh tạm dừng cho vấn đề{' '}
            <strong>"{issueTitle}"</strong> ?
          </p>
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
            onClick={onConfirm}
            className="bg-[#C8102E] hover:bg-[#a80d26]"
          >
            Tạm dừng
          </Button>
        </div>
      </div>
    </div>
  );
};
