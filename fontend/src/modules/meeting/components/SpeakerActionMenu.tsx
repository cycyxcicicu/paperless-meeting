import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Clock, UserCheck, XCircle } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface SpeakerActionMenuProps {
  speakerId: number;
  onPrepare: (id: number) => void;
  onAssign: (id: number) => void;
  onReject: (id: number) => void;
}

export const SpeakerActionMenu: React.FC<SpeakerActionMenuProps> = ({
  speakerId,
  onPrepare,
  onAssign,
  onReject,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 224, // 224px = w-56
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
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

  const actions = [
    {
      icon: Clock,
      label: 'Chuẩn bị phát biểu',
      onClick: () => onPrepare(speakerId),
      variant: 'default' as const
    },
    {
      icon: UserCheck,
      label: 'Chỉ định phát biểu',
      onClick: () => onAssign(speakerId),
      variant: 'default' as const
    },
    {
      icon: XCircle,
      label: 'Bác bỏ phát biểu',
      onClick: () => onReject(speakerId),
      variant: 'danger' as const
    },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all',
          isOpen && 'bg-gray-50 border-gray-400'
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-[9999] animate-in fade-in-0 zoom-in-95"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
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
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
