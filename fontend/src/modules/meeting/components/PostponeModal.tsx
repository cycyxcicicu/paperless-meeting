import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Label } from '@/common/components/ui/label';
import { Textarea } from '@/common/components/ui/textarea';
import { DateTimePicker } from '@/common/components/ui/datetime-picker';
import { cn } from '@/common/utils/cn';

interface PostponeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: PostponeData) => void;
  meetingId: string | number;
  oldStartTime: string;
  oldEndTime: string;
}

export interface PostponeData {
  newStartTime: string;
  newEndTime: string;
  reason: string;
}

export const PostponeModal: React.FC<PostponeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  meetingId,
  oldStartTime,
  oldEndTime,
}) => {
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNewStartTime('');
      setNewEndTime('');
      setReason('');
      setErrors({});
    }
  }, [isOpen]);

  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    try {
      const date = new Date(dateTimeStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateTimeStr;
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newStartTime) {
      newErrors.newStartTime = 'Vui lòng chọn thời gian bắt đầu mới';
    }

    if (!newEndTime) {
      newErrors.newEndTime = 'Vui lòng chọn thời gian kết thúc mới';
    }

    if (newStartTime && newEndTime) {
      const start = new Date(newStartTime);
      const end = new Date(newEndTime);

      if (start >= end) {
        newErrors.newEndTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }

      // Validate new time must be in the future
      const now = new Date();
      if (start <= now) {
        newErrors.newStartTime = 'Thời gian bắt đầu mới phải sau thời điểm hiện tại';
      }
    }

    if (!reason.trim()) {
      newErrors.reason = 'Vui lòng nhập lý do hoãn';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) {
      return;
    }

    onConfirm({
      newStartTime,
      newEndTime,
      reason,
    });

    // Reset form
    setNewStartTime('');
    setNewEndTime('');
    setReason('');
    setErrors({});
  };

  const handleClose = () => {
    setNewStartTime('');
    setNewEndTime('');
    setReason('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 animate-in fade-in-0 zoom-in-95 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-lg btn-primary text-gray-900">Hoãn phiên họp</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Thời gian họp cũ */}
          <div className="space-y-2">
            <Label className="text-sm body text-gray-700">Thời gian họp cũ</Label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-900 body">
                {formatDateTime(oldStartTime)} - {formatDateTime(oldEndTime)}
              </p>
            </div>
          </div>

          {/* Thời gian bắt đầu và kết thúc mới - cùng 1 hàng */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newStartTime" required className="text-sm body text-gray-700">
                Thời gian bắt đầu mới
              </Label>
              <DateTimePicker
                value={newStartTime}
                onChange={setNewStartTime}
                placeholder="Chọn thời gian bắt đầu mới"
                className={cn(
                  errors.newStartTime && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.newStartTime && (
                <p className="text-xs text-red-600 body">{errors.newStartTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newEndTime" required className="text-sm body text-gray-700">
                Thời gian kết thúc mới
              </Label>
              <DateTimePicker
                value={newEndTime}
                onChange={setNewEndTime}
                placeholder="Chọn thời gian kết thúc mới"
                className={cn(
                  errors.newEndTime && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.newEndTime && (
                <p className="text-xs text-red-600 body">{errors.newEndTime}</p>
              )}
            </div>
          </div>

          {/* Lý do hoãn */}
          <div className="space-y-2">
            <Label htmlFor="reason" required className="text-sm body text-gray-700">
              Lý do hoãn
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hoãn phiên họp..."
              rows={4}
              className={cn(
                'resize-none rounded-xl border-gray-300 hover:border-gray-400',
                errors.reason && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {errors.reason && (
              <p className="text-xs text-red-600 body">{errors.reason}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-amber-600 text-white hover:bg-amber-700 hover:shadow-lg"
          >
            Hoãn
          </Button>
        </div>
      </div>
    </div>
  );
};
