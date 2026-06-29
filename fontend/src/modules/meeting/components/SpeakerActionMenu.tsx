import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Clock, UserCheck, XCircle, StopCircle } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface SpeakerActionMenuProps {
  speakerId: string | number;
  speakerStatus?: string;
  onPrepare: (id: string | number) => void;
  onAssign: (id: string | number) => void;
  onReject: (id: string | number) => void;
  onEndSpeaking?: () => void;
}

export const SpeakerActionMenu: React.FC<SpeakerActionMenuProps> = ({
  speakerId,
  speakerStatus,
  onPrepare,
  onAssign,
  onReject,
  onEndSpeaking,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56 is 14rem = 224px
      const menuHeight = 120; // approximate height of the menu with 3 items

      // Calculate left position: align to right edge of button, but keep inside viewport
      let left = rect.right - menuWidth;
      if (left < 10) {
        left = 10; // Keep at least 10px from left edge
      }
      if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10; // Keep at least 10px from right edge
      }

      // Calculate top position: render below button by default, but flip if not enough space at bottom
      let top = rect.bottom + 8;
      if (top + menuHeight > window.innerHeight - 10 && rect.top - menuHeight - 8 > 10) {
        top = rect.top - menuHeight - 8; // Render above button
      }

      setPosition({ top, left });
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const actions = speakerStatus === 'speaking'
    ? [
        {
          icon: StopCircle,
          label: 'Kết thúc phát biểu',
          onClick: () => onEndSpeaking?.(),
          variant: 'danger' as const
        },
      ]
    : [
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

  if (speakerStatus === 'finished') return <span className="text-gray-400 text-xs">—</span>;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
