import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';
import { Button } from '@/common/components/ui/button';

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

  if (!isOpen) return null;

  const presetTimes = [5, 10, 15, 20, 30];

  const handleConfirm = () => {
    if (minutes > 0) {
      onConfirm(minutes);
      setMinutes(10); // Reset về mặc định
    }
  };

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
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#C8102E]" />
            <h3 className="text-lg btn-primary text-gray-900">
              Thiết lập thời gian biểu quyết
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-gray-600">
            Chọn hoặc nhập thời gian biểu quyết cho vấn đề này.
          </p>

          {/* Preset time buttons */}
          <div className="flex flex-wrap gap-2">
            {presetTimes.map((time) => (
              <button
                key={time}
                onClick={() => setMinutes(time)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  minutes === time
                    ? 'bg-[#C8102E] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {time} phút
              </button>
            ))}
          </div>

          {/* Custom time input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian tùy chỉnh (phút)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-colors"
              placeholder="Nhập số phút..."
            />
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              Thời gian biểu quyết: <strong>{minutes} phút</strong>
            </p>
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
