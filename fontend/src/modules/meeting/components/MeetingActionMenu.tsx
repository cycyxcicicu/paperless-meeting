import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit, Copy, Clock, XCircle, Send } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface MeetingActionMenuProps {
  meetingId: number;
  status: string;
  onViewDetail: (id: number) => void;
  onUpdate: (id: number) => void;
  onCopy: (id: number) => void;
  onPostpone?: (id: number) => void;
  onCancel?: (id: number) => void;
  onSend?: (id: number) => void;
}

export const MeetingActionMenu: React.FC<MeetingActionMenuProps> = ({
  meetingId,
  status,
  onViewDetail,
  onUpdate,
  onCopy,
  onPostpone,
  onCancel,
  onSend,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // Get actions based on status
  const getActions = () => {
    const actions = [];

    switch (status) {
      case 'Sắp diễn ra':
        actions.push(
          { icon: Edit, label: 'Cập nhật', onClick: () => onUpdate(meetingId), variant: 'default' },
          { icon: Copy, label: 'Sao chép phiên họp', onClick: () => onCopy(meetingId), variant: 'default' },
          { icon: Clock, label: 'Hoãn', onClick: () => onPostpone?.(meetingId), variant: 'default' },
          { icon: XCircle, label: 'Hủy', onClick: () => onCancel?.(meetingId), variant: 'danger' }
        );
        break;

      case 'Nháp':
        actions.push(
          { icon: Edit, label: 'Cập nhật', onClick: () => onUpdate(meetingId), variant: 'default' },
          { icon: Copy, label: 'Sao chép phiên họp', onClick: () => onCopy(meetingId), variant: 'default' },
          { icon: Send, label: 'Gửi đi', onClick: () => onSend?.(meetingId), variant: 'primary' }
        );
        break;

      case 'Đang diễn ra':
        actions.push(
          { icon: Edit, label: 'Cập nhật', onClick: () => onUpdate(meetingId), variant: 'default' },
          { icon: Copy, label: 'Sao chép phiên họp', onClick: () => onCopy(meetingId), variant: 'default' }
        );
        break;

      case 'Đã kết thúc':
        // No additional actions, only "Xem chi tiết" button shown outside menu
        break;

      default:
        break;
    }

    return actions;
  };

  const actions = getActions();

  // If status is "Đã kết thúc", no menu needed
  if (status === 'Đã kết thúc') {
    return null;
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all',
          isOpen && 'bg-gray-50 border-gray-400'
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in-0 zoom-in-95">
          <div className="py-1">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAction(action.onClick)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                    action.variant === 'danger'
                      ? 'text-red-600 hover:bg-red-50'
                      : action.variant === 'primary'
                      ? 'text-[#C8102E] hover:bg-red-50 body'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
