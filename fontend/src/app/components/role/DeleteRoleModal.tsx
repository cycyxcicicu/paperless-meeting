import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/hp-button';

interface DeleteRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  role?: {
    name: string;
    code: string;
    description?: string;
  };
}

export const DeleteRoleModal: React.FC<DeleteRoleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  role,
}) => {
  if (!isOpen || !role) return null;

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
            <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa vai trò</h3>
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
            Bạn có chắc chắn muốn xóa vai trò này? Hành động này không thể hoàn tác.
          </p>

          {/* Role Info */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-gray-600 min-w-[80px]">Tên vai trò:</span>
              <span className="text-sm font-semibold text-gray-900">{role.name}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-gray-600 min-w-[80px]">Mã vai trò:</span>
              <code className="text-sm font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-red-200">{role.code}</code>
            </div>
            {role.description && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[80px]">Mô tả:</span>
                <span className="text-sm text-gray-900">{role.description}</span>
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
            Xóa vai trò
          </Button>
        </div>
      </div>
    </div>
  );
};
