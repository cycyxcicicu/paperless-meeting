import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../ui/hp-button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';

interface VotingTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
}

export const VotingTimeModal: React.FC<VotingTimeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [minutes, setMinutes] = useState(10);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!minutes || minutes <= 0) {
      setError('Vui lòng nhập thời gian hợp lệ');
      return;
    }

    onConfirm(minutes);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Thời gian biểu quyết
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="votingTime" required className="text-sm font-medium text-gray-700">
              Thời gian biểu quyết (phút)
            </Label>
            <Input
              id="votingTime"
              type="number"
              min="1"
              value={minutes}
              onChange={(e) => {
                setMinutes(Number(e.target.value));
                setError('');
              }}
              placeholder="Nhập số phút"
              className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}
          </div>
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
