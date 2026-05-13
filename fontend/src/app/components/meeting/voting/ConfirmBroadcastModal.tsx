import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/common/ui/Button';

interface ConfirmBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (checkReadiness: boolean) => void;
  issueTitle: string;
}

export const ConfirmBroadcastModal: React.FC<ConfirmBroadcastModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  issueTitle,
}) => {
  const [checkReadiness, setCheckReadiness] = useState(false);

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
          <h3 className="text-lg font-semibold text-gray-900">
            Xác nhận phát lệnh biểu quyết
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
          <p className="text-sm text-gray-700">
            Bạn có muốn phát lệnh biểu quyết cho vấn đề{' '}
            <strong>"{issueTitle}"</strong> ?
          </p>

          {/* Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={checkReadiness}
              onChange={(e) => setCheckReadiness(e.target.checked)}
              className="w-4 h-4 text-[#C8102E] border-gray-300 rounded focus:ring-[#C8102E]"
            />
            <span className="text-sm font-medium text-gray-900">
              Kiểm tra trạng thái sẵn sàng
            </span>
          </label>
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
            onClick={() => onConfirm(checkReadiness)}
            className="bg-[#C8102E] hover:bg-[#a80d26]"
          >
            Phát lệnh biểu quyết
          </Button>
        </div>
      </div>
    </div>
  );
};
