import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/common/ui/Button';

interface DeleteLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  location?: {
    name: string;
    code: string;
    type?: string;
  };
}

export const DeleteLocationModal: React.FC<DeleteLocationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  location,
}) => {
  if (!isOpen || !location) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa địa điểm</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc chắn muốn xóa địa điểm họp này? Hành động này không thể hoàn tác.
          </p>

          {/* Location Info */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-gray-600 min-w-[80px]">Tên phòng:</span>
              <span className="text-sm font-semibold text-gray-900">{location.name}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-gray-600 min-w-[80px]">Mã phòng:</span>
              <code className="text-sm font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-red-200">{location.code}</code>
            </div>
            {location.type && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[80px]">Loại:</span>
                <span className="text-sm text-gray-900">{location.type}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-5 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white"
          >
            Xóa địa điểm
          </Button>
        </div>
      </div>
    </div>
  );
};
