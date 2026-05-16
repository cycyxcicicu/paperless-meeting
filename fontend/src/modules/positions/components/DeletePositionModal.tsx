import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';

interface DeletePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  position?: {
    name: string;
    description?: string;
  };
}

export const DeletePositionModal: React.FC<DeletePositionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  position,
}) => {
  if (!position) return null;

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
          <span className="text-lg btn-primary text-gray-900">Xác nhận xóa chức vụ</span>
        </div>
      }
    >
      <div className="py-2">
        <p className="text-sm text-gray-600 mb-4">
          Bạn có chắc chắn muốn xóa chức vụ này? Hành động này không thể hoàn tác.
        </p>

        {/* Position Info */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs btn-primary text-gray-600 min-w-[80px]">Tên chức vụ:</span>
            <span className="text-sm btn-primary text-gray-900">{position.name}</span>
          </div>
          {position.description && (
            <div className="flex items-start gap-2">
              <span className="text-xs btn-primary text-gray-600 min-w-[80px]">Mô tả:</span>
              <span className="text-sm text-gray-900">{position.description}</span>
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
          Xóa chức vụ
        </Button>
      </div>
    </Modal>
  );
};
