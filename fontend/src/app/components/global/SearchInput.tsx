import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../ui/utils';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  className,
  placeholder = 'Tìm kiếm...',
  onSearch,
  ...props
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(e.currentTarget.value);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
      <input
        type="text"
        placeholder={placeholder}
        onKeyPress={handleKeyPress}
        className={cn(
          'w-full h-10 pl-10 pr-4 rounded-xl border border-[#E5E7EB] bg-white',
          'text-[13px] text-[#111827] placeholder:text-[#9CA3AF]',
          'focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent',
          'transition-all'
        )}
        {...props}
      />
    </div>
  );
};
