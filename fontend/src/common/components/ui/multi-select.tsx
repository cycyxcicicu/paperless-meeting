import React from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Badge } from '@/common/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/common/components/ui/popover';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  label?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  values = [],
  onChange,
  options,
  placeholder = 'Chọn...',
  className,
  error = false,
  disabled = false,
  label,
}) => {
  const selectedOptions = options.filter((opt) => values.includes(opt.value));

  const handleToggleOption = (optionValue: string) => {
    const newValues = values.includes(optionValue)
      ? values.filter((v) => v !== optionValue)
      : [...values, optionValue];
    onChange(newValues);
  };

  const handleRemoveValue = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange(values.filter((v) => v !== optionValue));
  };

  return (
    <div className="space-y-2 w-full">
      {label && <label className="block text-sm body text-gray-700">{label}</label>}
      
      <Popover>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'relative min-h-10 w-full p-2 rounded-xl border bg-white text-sm text-left transition-all flex flex-wrap items-center gap-1.5 cursor-pointer pr-10',
              'border-gray-300 hover:border-gray-400',
              'focus-within:ring-2 focus-within:ring-[#C8102E]/20 focus-within:border-[#C8102E]',
              error && 'border-red-500 focus-within:ring-red-500/20 focus-within:border-red-500',
              disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
              className
            )}
          >
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 gap-1 border-none py-1 px-2 rounded-lg"
                >
                  {option.label}
                  {!disabled && (
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={(e) => handleRemoveValue(e, option.value)}
                    />
                  )}
                </Badge>
              ))
            ) : (
              <span className="text-gray-400 pl-1">{placeholder}</span>
            )}
            
            <div className="absolute right-3 top-0 h-full flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="p-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-[var(--radix-popover-trigger-width)] z-[100]" 
          align="start"
          sideOffset={8}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="max-h-64 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                Không có dữ liệu
              </div>
            ) : (
              options.map((option) => {
                const isSelected = values.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggleOption(option.value)}
                    className={cn(
                      'w-full px-3 py-2.5 text-sm text-left transition-colors flex items-center justify-between rounded-lg',
                      'hover:bg-gray-50',
                      isSelected && 'bg-red-50 text-[#C8102E] body'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                        isSelected ? "bg-[#C8102E] border-[#C8102E]" : "bg-white border-gray-300"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
