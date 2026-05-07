import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, isValid, setHours, setMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '../../../lib/utils';
import 'react-day-picker/dist/style.css';

interface DateTimePickerProps {
  value: string; // ISO datetime string format: YYYY-MM-DDTHH:MM
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Chọn ngày giờ',
  className,
  error = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');
  const containerRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (isValid(date)) {
          setSelectedDate(date);
          const hours = date.getHours();
          const hour12 = hours % 12 || 12;
          setSelectedHour(hour12);
          setSelectedMinute(date.getMinutes());
          setSelectedPeriod(hours >= 12 ? 'PM' : 'AM');
        }
      } catch (error) {
        console.error('Invalid datetime value:', error);
      }
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Auto-scroll to selected hour/minute when dropdown opens
  useEffect(() => {
    if (isOpen && hourScrollRef.current && minuteScrollRef.current) {
      setTimeout(() => {
        const hourIndex = selectedHour - 1;
        const minuteIndex = selectedMinute;

        if (hourScrollRef.current) {
          const hourButton = hourScrollRef.current.children[hourIndex] as HTMLElement;
          if (hourButton) {
            hourButton.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }

        if (minuteScrollRef.current) {
          const minuteButton = minuteScrollRef.current.children[minuteIndex] as HTMLElement;
          if (minuteButton) {
            minuteButton.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }, 100);
    }
  }, [isOpen, selectedHour, selectedMinute]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateDateTime(date, selectedHour, selectedMinute, selectedPeriod);
    }
  };

  const handleHourChange = (hour: number) => {
    setSelectedHour(hour);
    if (selectedDate) {
      updateDateTime(selectedDate, hour, selectedMinute, selectedPeriod);
    }
  };

  const handleMinuteChange = (minute: number) => {
    setSelectedMinute(minute);
    if (selectedDate) {
      updateDateTime(selectedDate, selectedHour, minute, selectedPeriod);
    }
  };

  const handlePeriodChange = (period: 'AM' | 'PM') => {
    setSelectedPeriod(period);
    if (selectedDate) {
      updateDateTime(selectedDate, selectedHour, selectedMinute, period);
    }
  };

  const updateDateTime = (date: Date, hour: number, minute: number, period: 'AM' | 'PM') => {
    let hour24 = hour;
    if (period === 'PM' && hour !== 12) {
      hour24 = hour + 12;
    } else if (period === 'AM' && hour === 12) {
      hour24 = 0;
    }

    const newDate = setMinutes(setHours(date, hour24), minute);
    const formattedValue = format(newDate, "yyyy-MM-dd'T'HH:mm");
    onChange(formattedValue);
  };

  const displayValue = () => {
    if (!value) return placeholder;

    try {
      const date = new Date(value);
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy hh:mm a', { locale: vi });
      }
    } catch (error) {
      return placeholder;
    }

    return placeholder;
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    onChange('');
  };

  const handleToday = () => {
    const now = new Date();
    const hours = now.getHours();
    const hour12 = hours % 12 || 12;

    setSelectedDate(now);
    setSelectedHour(hour12);
    setSelectedMinute(now.getMinutes());
    setSelectedPeriod(hours >= 12 ? 'PM' : 'AM');

    const formattedValue = format(now, "yyyy-MM-dd'T'HH:mm");
    onChange(formattedValue);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div ref={containerRef} className="relative">
      {/* Input Button */}
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
          !value && 'text-gray-400',
          className
        )}
      >
        <span className="flex-1 truncate">{displayValue()}</span>
        <CalendarIcon className="h-4 w-4 text-gray-500 shrink-0 ml-auto" />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 bg-white border border-gray-300 rounded-xl shadow-lg overflow-hidden',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <div className="flex">
            {/* LEFT: Calendar */}
            <div className="p-3 border-r border-gray-200">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={vi}
                className="datetime-picker-calendar"
                classNames={{
                  months: 'flex flex-col space-y-4',
                  month: 'space-y-4',
                  caption: 'flex justify-center pt-1 relative items-center mb-1',
                  caption_label: 'text-sm font-semibold text-gray-700',
                  nav: 'space-x-1 flex items-center',
                  nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md hover:bg-gray-100 transition-all',
                  nav_button_previous: 'absolute left-1',
                  nav_button_next: 'absolute right-1',
                  table: 'w-full border-collapse space-y-1',
                  head_row: 'flex',
                  head_cell: 'text-gray-500 rounded-md w-9 font-semibold text-[0.75rem] uppercase',
                  row: 'flex w-full mt-2',
                  cell: 'h-9 w-9 text-center text-sm p-0 relative',
                  day: 'h-9 w-9 p-0 font-medium rounded-lg hover:bg-gray-100 transition-all cursor-pointer',
                  day_selected: 'bg-[#C8102E] text-white hover:bg-[#A90F14] hover:text-white focus:bg-[#C8102E] focus:text-white font-bold shadow-md ring-2 ring-[#C8102E]/30 ring-offset-1',
                  day_today: 'bg-blue-50 text-blue-700 font-semibold border border-blue-200',
                  day_outside: 'text-gray-300 opacity-40',
                  day_disabled: 'text-gray-300 opacity-30 cursor-not-allowed',
                  day_hidden: 'invisible',
                }}
              />
            </div>

            {/* RIGHT: Time Picker */}
            <div className="w-48 p-3 flex flex-col bg-gray-50/50">
              <div className="text-sm font-semibold text-gray-700 mb-3 text-center">
                Chọn giờ
              </div>

              <div className="flex gap-2 flex-1">
                {/* Hours */}
                <div className="flex-1">
                  <div className="text-xs text-gray-500 text-center mb-1.5 font-medium">Giờ</div>
                  <div ref={hourScrollRef} className="h-48 overflow-y-auto border border-gray-200 rounded-lg time-scroll bg-gray-50/30">
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleHourChange(hour)}
                        className={cn(
                          'w-full px-2 py-1.5 text-sm text-center transition-all',
                          selectedHour === hour
                            ? 'bg-[#C8102E] text-white font-bold shadow-sm'
                            : 'hover:bg-gray-100 text-gray-700 font-medium'
                        )}
                      >
                        {hour.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minutes */}
                <div className="flex-1">
                  <div className="text-xs text-gray-500 text-center mb-1.5 font-medium">Phút</div>
                  <div ref={minuteScrollRef} className="h-48 overflow-y-auto border border-gray-200 rounded-lg time-scroll bg-gray-50/30">
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleMinuteChange(minute)}
                        className={cn(
                          'w-full px-2 py-1.5 text-sm text-center transition-all',
                          selectedMinute === minute
                            ? 'bg-[#C8102E] text-white font-bold shadow-sm'
                            : 'hover:bg-gray-100 text-gray-700 font-medium'
                        )}
                      >
                        {minute.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AM/PM */}
                <div className="w-16">
                  <div className="text-xs text-gray-500 text-center mb-1.5 font-medium">&nbsp;</div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handlePeriodChange('AM')}
                      className={cn(
                        'px-2 py-2 text-sm text-center rounded-lg transition-all font-semibold',
                        selectedPeriod === 'AM'
                          ? 'bg-[#C8102E] text-white shadow-md scale-105'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
                      )}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePeriodChange('PM')}
                      className={cn(
                        'px-2 py-2 text-sm text-center rounded-lg transition-all font-semibold',
                        selectedPeriod === 'PM'
                          ? 'bg-[#C8102E] text-white shadow-md scale-105'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
                      )}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3 flex justify-between items-center bg-gray-50">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all font-medium border border-transparent hover:border-gray-300"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all font-medium border border-transparent hover:border-gray-300"
              >
                Hôm nay
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 text-sm text-white bg-[#C8102E] hover:bg-[#A90F14] rounded-lg transition-all font-semibold shadow-sm hover:shadow"
            >
              Xong
            </button>
          </div>
        </div>
      )}

      <style>{`
        .datetime-picker-calendar {
          font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Custom scrollbar cho cột giờ/phút - mảnh và tinh gọn */
        .time-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .time-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .time-scroll::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 2px;
        }

        .time-scroll::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }

        /* Firefox scrollbar */
        .time-scroll {
          scrollbar-width: thin;
          scrollbar-color: #D1D5DB transparent;
        }
      `}</style>
    </div>
  );
};
