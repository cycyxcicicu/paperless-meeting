import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user?: {
    username: string;
    fullName: string;
    email: string;
    department: string;
  };
  count?: number; // Hỗ trợ xóa nhiều
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  count,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const isBulkDelete = count !== undefined && count > 1;

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
          <span className="text-lg btn-primary text-gray-900">
            Xác nhận xóa {isBulkDelete ? 'nhiều người dùng' : 'người dùng'}
          </span>
        </div>
      }
    >
      <div className="py-2">
        <p className="text-sm text-gray-600 mb-4">
          {isBulkDelete 
            ? `Bạn có chắc chắn muốn xóa ${count} người dùng đã chọn? Hành động này không thể hoàn tác.`
            : 'Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.'
          }
        </p>

        {/* User Info (Only show if single delete) */}
        {!isBulkDelete && user && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs btn-primary text-gray-600 min-w-[100px]">Tên đăng nhập:</span>
              <span className="text-sm btn-primary text-gray-900">{user.username}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs btn-primary text-gray-600 min-w-[100px]">Họ và tên:</span>
              <span className="text-sm text-gray-900">{user.fullName}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs btn-primary text-gray-600 min-w-[100px]">Email:</span>
              <span className="text-sm text-gray-900">{user.email}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs btn-primary text-gray-600 min-w-[100px]">Đơn vị:</span>
              <span className="text-sm text-gray-900">
                {typeof user.department === 'object' && user.department !== null
                  ? (user.department as any).deptName || (user.department as any).name || ''
                  : String(user.department || '')
                }
              </span>
            </div>
          </div>
        )}
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
          Xác nhận xóa
        </Button>
      </div>
    </Modal>
  );
};
