import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';

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
  if (!role) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="sm:max-w-md"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <span className="text-lg btn-primary text-gray-900">Xác nhận xóa vai trò</span>
        </div>
      }
    >
      <div className="py-2">
        <p className="text-sm text-gray-600 mb-4">
          Bạn có chắc chắn muốn xóa vai trò này? Hành động này không thể hoàn tác.
        </p>

        {/* Role Info */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs btn-primary text-gray-600 min-w-[80px]">Tên vai trò:</span>
            <span className="text-sm btn-primary text-gray-900">{role.name}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs btn-primary text-gray-600 min-w-[80px]">Mã vai trò:</span>
            <code className="text-sm font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-red-200">{role.code}</code>
          </div>
          {role.description && (
            <div className="flex items-start gap-2">
              <span className="text-xs btn-primary text-gray-600 min-w-[80px]">Mô tả:</span>
              <span className="text-sm text-gray-900">{role.description}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Hủy bỏ
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleConfirm}
        >
          Xóa vai trò
        </Button>
      </div>
    </Modal>
  );
};
