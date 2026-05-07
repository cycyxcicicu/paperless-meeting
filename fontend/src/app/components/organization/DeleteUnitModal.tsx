import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/hp-button';

interface DeleteUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unit?: {
    name: string;
    code: string;
  };
}

export const DeleteUnitModal: React.FC<DeleteUnitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  unit,
}) => {
  if (!isOpen || !unit) return null;

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
            <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa đơn vị</h3>
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
            Bạn có chắc chắn muốn xóa đơn vị này không? Hành động này không thể hoàn tác.
          </p>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">Tên đơn vị:</span>
              <span className="text-sm font-semibold text-gray-900">{unit.name}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">Mã đơn vị:</span>
              <code className="text-sm font-mono font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-red-200">
                {unit.code}
              </code>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 font-medium">
              ⚠️ Lưu ý: Nếu đơn vị này có đơn vị con hoặc nhân sự, bạn cần xử lý trước khi xóa.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-5 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            className="px-5 py-2 bg-red-600 text-white hover:bg-red-700"
          >
            Xóa đơn vị
          </Button>
        </div>
      </div>
    </div>
  );
};
