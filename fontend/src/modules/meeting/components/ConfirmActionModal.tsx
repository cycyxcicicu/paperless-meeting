import React from 'react';
import { X, AlertTriangle, Send, XCircle, Clock } from 'lucide-react';
import { cn } from '@/common/utils/cn';

type ActionType = 'cancel' | 'send' | 'postpone' | 'end';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: ActionType;
  meetingTitle?: string;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  meetingTitle,
}) => {
  if (!isOpen) return null;

  const getModalContent = () => {
    switch (actionType) {
      case 'cancel':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-50',
          title: 'Hủy phiên họp',
          message: 'Bạn có chắc chắn muốn hủy phiên họp này?',
          confirmText: 'Hủy phiên họp',
          confirmVariant: 'danger' as const,
        };
      case 'send':
        return {
          icon: Send,
          iconColor: 'text-[#C8102E]',
          iconBg: 'bg-red-50',
          title: 'Gửi phiên họp',
          message: 'Bạn có chắc chắn muốn gửi phiên họp này?',
          confirmText: 'Gửi phiên họp',
          confirmVariant: 'primary' as const,
        };
      case 'postpone':
        return {
          icon: Clock,
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-50',
          title: 'Hoãn phiên họp',
          message: 'Bạn có chắc chắn muốn hoãn phiên họp này?',
          confirmText: 'Hoãn phiên họp',
          confirmVariant: 'warning' as const,
        };
      case 'end':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-50',
          title: 'Kết thúc phiên họp',
          message: 'Bạn có chắc muốn kết thúc phiên họp này?',
          confirmText: 'Kết thúc',
          confirmVariant: 'danger' as const,
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-gray-600',
          iconBg: 'bg-gray-50',
          title: 'Xác nhận',
          message: 'Bạn có chắc chắn muốn thực hiện hành động này?',
          confirmText: 'Xác nhận',
          confirmVariant: 'primary' as const,
        };
    }
  };

  const content = getModalContent();
  const Icon = content.icon;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
            <div className={cn('p-2 rounded-lg', content.iconBg)}>
              <Icon className={cn('h-5 w-5', content.iconColor)} />
            </div>
            <h3 className="text-lg btn-primary text-gray-900">{content.title}</h3>
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
          <p className="text-sm text-gray-600 mb-2">{content.message}</p>
          {meetingTitle && (
            <p className="text-sm btn-primary text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
              {meetingTitle}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 body text-sm hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'px-4 py-2 rounded-lg btn-primary text-sm transition-all',
              content.confirmVariant === 'danger' &&
                'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg',
              content.confirmVariant === 'primary' &&
                'bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white hover:shadow-lg hover:shadow-red-500/25',
              content.confirmVariant === 'warning' &&
                'bg-amber-600 text-white hover:bg-amber-700 hover:shadow-lg'
            )}
          >
            {content.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
