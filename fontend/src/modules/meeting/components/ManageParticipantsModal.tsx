import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { ThanhPhanThamDuStep, ThanhPhanThamDuData } from './ThanhPhanThamDuStep';

interface ManageParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (data: ThanhPhanThamDuData) => void;
  initialData: ThanhPhanThamDuData;
  readOnly?: boolean;
}

export const ManageParticipantsModal: React.FC<ManageParticipantsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialData,
  readOnly = false,
}) => {
  const [data, setData] = useState<ThanhPhanThamDuData>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(data);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 animate-in fade-in-0 zoom-in-95 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h3 className="text-lg btn-primary text-gray-900">
            {readOnly ? 'Thành phần tham gia' : 'Quản lý thành phần tham gia'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <ThanhPhanThamDuStep data={data} onChange={readOnly ? undefined : setData} readOnly={readOnly} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50/50">
          <Button variant="ghost" onClick={onClose}>
            {readOnly ? 'Đóng' : 'Hủy bỏ'}
          </Button>
          {!readOnly && (
            <Button variant="primary" onClick={handleConfirm} className="bg-[#C8102E] hover:bg-[#a80d26]">
              Lưu thay đổi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
