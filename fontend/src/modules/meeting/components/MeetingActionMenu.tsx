import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Copy, Clock, XCircle, Send, FileUp, CheckSquare } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface MeetingActionMenuProps {
  meetingId: string;
  canEdit?: boolean;
  canCancel?: boolean;
  canPublish?: boolean;
  canDelete?: boolean;
  canSubmitApproval?: boolean;
  canUploadDocs?: boolean;
  canCopy?: boolean;
  canApprove?: boolean;
  onViewDetail: (id: string) => void;
  onUpdate: (id: string) => void;
  onCopy: (id: string) => void;
  onCancel?: (id: string) => void;
  onSend?: (id: string) => void;
  onUploadDocs?: (id: string) => void;
}

export const MeetingActionMenu: React.FC<MeetingActionMenuProps> = ({
  meetingId,
  canEdit,
  canCancel,
  canPublish,
  canSubmitApproval,
  canUploadDocs,
  canCopy,
  canApprove,
  onViewDetail,
  onUpdate,
  onCopy,
  onCancel,
  onSend,
  onUploadDocs,
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

  // Get actions based on permissions
  const getActions = () => {
    const actions = [];

    // 1. Quyền sửa toàn phần (Creator/Chair/Admin) hoặc Quyền phê duyệt (Giám đốc/Chủ tịch)
    if (canEdit || canApprove) {
      actions.push({
        icon: Edit,
        label: 'Cập nhật phiên họp',
        onClick: () => onUpdate(meetingId),
        variant: 'default'
      });
    }

    // 2. Quyền chuẩn bị tài liệu (Preparer - chỉ hiển thị khi không có quyền sửa toàn phần)
    if (canUploadDocs && !canEdit) {
      actions.push({
        icon: FileUp,
        label: 'Cập nhật tài liệu',
        onClick: () => onUploadDocs?.(meetingId),
        variant: 'primary'
      });
    }


    // 4. Quyền công bố (Publish)
    if (canPublish) {
      actions.push({
        icon: Send,
        label: 'Công bố phiên họp',
        onClick: () => onSend?.(meetingId),
        variant: 'primary'
      });
    }



    // 6. Quyền hủy họp (Cancel)
    if (canCancel) {
      actions.push({
        icon: XCircle,
        label: 'Hủy phiên họp',
        onClick: () => onCancel?.(meetingId),
        variant: 'danger'
      });
    }

    // 7. Quyền sao chép (Chỉ cho phép khi có quyền copy / là người tạo)
    if (canCopy) {
      actions.push({
        icon: Copy,
        label: 'Sao chép phiên họp',
        onClick: () => onCopy(meetingId),
        variant: 'default'
      });
    }

    return actions;
  };

  const actions = getActions();

  // Nếu không có hành động nào khả dụng, không hiển thị menu 3 chấm
  if (actions.length === 0) {
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
                      ? 'text-[#C8102E] hover:bg-red-50 body font-semibold'
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
