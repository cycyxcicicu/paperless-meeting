import React from 'react';
import { X, User } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Badge } from '@/common/components/ui/badge';

interface AttendanceDetailRecord {
  id: number;
  unit: string;
  name: string;
  position: string;
  status: 'present' | 'pending' | 'absent';
  reasonAbsent?: string;
  replacementPerson?: {
    name: string;
    position: string;
    unit: string;
  };
}

interface AttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceDetailRecord | null;
}

export const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen || !record) return null;

  const getStatusBadge = () => {
    switch (record.status) {
      case 'present':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-4 py-1.5 text-sm rounded-full border-none">
            Có tham gia
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-4 py-1.5 text-sm rounded-full border-none">
            Chưa xác nhận
          </Badge>
        );
      case 'absent':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-4 py-1.5 text-sm rounded-full border-none">
            Báo vắng
          </Badge>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg btn-primary text-gray-900">
            Thông tin điểm danh
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Main Info */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-blue-600" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg btn-primary text-gray-900 mb-1">
                    {record.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-0.5">
                    {record.position}
                  </p>
                  <p className="text-sm text-gray-500">{record.unit}</p>
                </div>
                <div className="flex-shrink-0">{getStatusBadge()}</div>
              </div>
            </div>
          </div>

          {/* Additional Info for "Báo vắng" status */}
          {record.status === 'absent' && (
            <>
              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Reason */}
              {record.reasonAbsent && (
                <div className="space-y-2">
                  <p className="text-sm btn-primary text-gray-700">Lý do:</p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {record.reasonAbsent}
                    </p>
                  </div>
                </div>
              )}

              {/* Replacement Person */}
              <div className="space-y-2">
                <p className="text-sm btn-primary text-gray-700">
                  Người đi thay
                </p>
                {record.replacementPerson ? (
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm btn-primary text-gray-900 mb-0.5">
                        {record.replacementPerson.name}
                      </p>
                      <p className="text-xs text-gray-600 mb-0.5">
                        {record.replacementPerson.position}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.replacementPerson.unit}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500 text-center">
                      Không có người đi thay
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            className="bg-[#C8102E] hover:bg-[#a80d26] px-8 rounded-full"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

export type { AttendanceDetailRecord };
