import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/common/components/ui/button';

interface ApproveContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentTitle: string;
  contentId: string | number;
  onConfirm: (contentId: string | number, isApproved: boolean) => void;
}

export const ApproveContentModal: React.FC<ApproveContentModalProps> = ({
  isOpen,
  onClose,
  contentTitle,
  contentId,
  onConfirm,
}) => {
  const [selectedOption, setSelectedOption] = useState<'approve' | 'reject'>('approve');

  const handleClose = () => {
    setSelectedOption('approve');
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(contentId, selectedOption === 'approve');
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg btn-primary text-gray-900">
            Xác nhận phê duyệt nội dung
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Confirmation Text */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-900">
              Xác nhận phê duyệt cho nội dung <strong>"{contentTitle}"</strong>
            </p>
          </div>

          {/* Radio Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="approval"
                value="approve"
                checked={selectedOption === 'approve'}
                onChange={() => setSelectedOption('approve')}
                className="w-4 h-4 text-[#C8102E] border-gray-300 focus:ring-[#C8102E]"
              />
              <span className="text-sm body text-gray-900">Phê duyệt</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="approval"
                value="reject"
                checked={selectedOption === 'reject'}
                onChange={() => setSelectedOption('reject')}
                className="w-4 h-4 text-[#C8102E] border-gray-300 focus:ring-[#C8102E]"
              />
              <span className="text-sm body text-gray-900">
                Từ chối phê duyệt
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-[#C8102E] hover:bg-[#a80d26]"
          >
            Xác nhận
          </Button>
        </div>
      </div>
    </div>
  );
};
