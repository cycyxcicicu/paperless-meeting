import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';

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
  if (!unit) return null;

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
          <span className="text-lg btn-primary text-gray-900">Xác nhận xóa đơn vị</span>
        </div>
      }
    >
      <div className="py-2">
        <p className="text-sm text-gray-600 mb-4">
          Bạn có chắc chắn muốn xóa đơn vị này không? Hành động này không thể hoàn tác.
        </p>

        <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-sm body text-gray-700 w-24 flex-shrink-0">Tên đơn vị:</span>
            <span className="text-sm btn-primary text-gray-900">{unit.name}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-sm body text-gray-700 w-24 flex-shrink-0">Mã đơn vị:</span>
            <code className="text-sm font-mono btn-primary text-gray-900 bg-white px-2 py-0.5 rounded border border-red-200">
              {unit.code}
            </code>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800 body">
            ⚠️ Lưu ý: Nếu đơn vị này có đơn vị con hoặc nhân sự, bạn cần xử lý trước khi xóa.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
        >
          Xóa đơn vị
        </Button>
      </div>
    </Modal>
  );
};
