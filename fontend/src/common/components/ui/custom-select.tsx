import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/common/utils/cn';

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  showSearch?: boolean;
  allowClear?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  className,
  error = false,
  disabled = false,
  showSearch = false,
  allowClear = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    (opt.label ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  // Update position when opening
  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);

      if (!isInsideContainer && !isInsideDropdown) {
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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full h-10 pl-3 pr-3 rounded-xl border bg-white text-sm text-left transition-all flex items-center justify-between gap-2',
          'border-gray-400 hover:border-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]',
          error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          className
        )}
      >
        <span className={cn('flex-1 truncate', !selectedOption && 'text-gray-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {allowClear && value && !disabled && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </div>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-500 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu using Portal */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className={cn(
            'fixed z-[9999] bg-white border border-gray-300 rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95'
          )}
          style={{
            top: `${dropdownPos.top + 8}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
          }}
        >
          {showSearch && (
            <div className="p-2 border-b border-gray-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Tìm kiếm..."
                className="flex-1 text-sm outline-none bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                Không có dữ liệu
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full px-3 py-2.5 text-sm text-left transition-colors flex items-center justify-between',
                    'hover:bg-gray-50',
                    option.value === value && 'bg-red-50 text-[#C8102E] body',
                    index === 0 && !showSearch && 'rounded-t-xl',
                    index === filteredOptions.length - 1 && 'rounded-b-xl'
                  )}
                >
                  <span>{option.label}</span>
                  {option.value === value && <Check className="h-4 w-4 text-[#C8102E]" />}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
