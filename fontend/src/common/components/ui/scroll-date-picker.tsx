import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getDaysInMonth } from 'date-fns';
import { cn } from '@/common/utils/cn';

interface ScrollDatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  disableFutureDates?: boolean;
  disablePastDates?: boolean;
  showTime?: boolean;
}

const Column = ({ 
  items, 
  value, 
  onChange, 
  label,
  padZero = true,
  isDisabled,
}: { 
  items: number[], 
  value: number, 
  onChange: (val: number) => void,
  label?: string,
  padZero?: boolean,
  isDisabled?: (val: number) => boolean,
}) => {
  const colRef = useRef<HTMLDivElement>(null);
  
  // Center active element on mount and value change
  useEffect(() => {
    const el = colRef.current?.querySelector(`[data-active="true"]`) as HTMLElement;
    if (el && colRef.current) {
      const parent = colRef.current;
      const scrollPos = el.offsetTop - parent.clientHeight / 2 + el.clientHeight / 2;
      parent.scrollTo({ top: scrollPos, behavior: 'smooth' });
    }
  }, [value, items.length]); // re-run if items change (e.g. days in month changed)

  return (
    <div className="flex flex-col flex-1 h-full border-r last:border-r-0 border-gray-100 bg-white min-w-[60px]">
      {label && (
        <div className="text-center text-[10px] uppercase font-bold text-gray-400 py-1.5 bg-gray-50/80 border-b border-gray-100 shrink-0">
          {label}
        </div>
      )}
      <div 
        ref={colRef}
        onWheel={(e) => e.stopPropagation()}
        className="flex-1 overflow-y-scroll overscroll-contain relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="h-[calc(50%-20px)] shrink-0" />
        {items.map(item => {
          const disabled = isDisabled && isDisabled(item);
          return (
            <div 
              key={item}
              data-active={item === value}
              onClick={() => !disabled && onChange(item)}
              className={cn(
                "h-10 flex items-center justify-center transition-all duration-200 select-none",
                disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50 hover:text-gray-800",
                item === value && !disabled
                  ? "text-[#C8102E] font-bold bg-red-50/50 border-y border-[#C8102E]/20 text-base scale-110" 
                  : "text-gray-500 text-sm"
              )}
            >
              {padZero && item < 10 ? `0${item}` : item}
            </div>
          );
        })}
        <div className="h-[calc(50%-20px)] shrink-0" />
      </div>
    </div>
  );
};

export const ScrollDatePicker: React.FC<ScrollDatePickerProps> = ({
  value,
  onChange,
  disableFutureDates = false,
  disablePastDates = false,
  showTime = false,
}) => {
  const now = new Date();
  
  const initDate = value || now;
  const [selectedYear, setSelectedYear] = useState<number>(initDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(initDate.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(initDate.getDate());
  const [selectedHour, setSelectedHour] = useState<number>(initDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(initDate.getMinutes());

  useEffect(() => {
    if (value) {
      setSelectedYear(value.getFullYear());
      setSelectedMonth(value.getMonth() + 1);
      setSelectedDay(value.getDate());
      setSelectedHour(value.getHours());
      setSelectedMinute(value.getMinutes());
    }
  }, [value]);

  const isCurrentYear = disableFutureDates && selectedYear === now.getFullYear();
  const isCurrentMonth = isCurrentYear && selectedMonth === (now.getMonth() + 1);
  const isCurrentDay = isCurrentMonth && selectedDay === now.getDate();
  const isCurrentHour = isCurrentDay && selectedHour === now.getHours();

  const years = useMemo(() => {
    const y = [];
    for (let i = 1900; i <= now.getFullYear() + 20; i++) y.push(i);
    return y.reverse();
  }, [now.getFullYear()]);

  const months = useMemo(() => {
    const m = [];
    for (let i = 1; i <= 12; i++) m.push(i);
    return m;
  }, []);

  const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
  
  const days = useMemo(() => {
    const d = [];
    for (let i = 1; i <= daysInMonth; i++) d.push(i);
    return d;
  }, [daysInMonth]);

  const hours = useMemo(() => {
    if (!showTime) return [];
    const h = [];
    for (let i = 0; i <= 23; i++) h.push(i);
    return h;
  }, [showTime]);

  const minutes = useMemo(() => {
    if (!showTime) return [];
    const min = [];
    for (let i = 0; i <= 59; i++) min.push(i);
    return min;
  }, [showTime]);

  // Disable logic
  const isYearDisabled = (y: number) => {
    if (disableFutureDates && y > now.getFullYear()) return true;
    if (disablePastDates && y < now.getFullYear()) return true;
    return false;
  };
  const isMonthDisabled = (m: number) => {
    if (disableFutureDates && selectedYear === now.getFullYear() && m > now.getMonth() + 1) return true;
    if (disablePastDates && selectedYear === now.getFullYear() && m < now.getMonth() + 1) return true;
    return false;
  };
  const isDayDisabled = (d: number) => {
    if (disableFutureDates && selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1 && d > now.getDate()) return true;
    if (disablePastDates && selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1 && d < now.getDate()) return true;
    return false;
  };
  const isHourDisabled = (h: number) => {
    if (disableFutureDates && selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1 && selectedDay === now.getDate() && h > now.getHours()) return true;
    if (disablePastDates && selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1 && selectedDay === now.getDate() && h < now.getHours()) return true;
    return false;
  };
  const isMinuteDisabled = (m: number) => {
    if (disableFutureDates && selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1 && selectedDay === now.getDate() && selectedHour === now.getHours() && m > now.getMinutes()) return true;
    if (disablePastDates && selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1 && selectedDay === now.getDate() && selectedHour === now.getHours() && m < now.getMinutes()) return true;
    return false;
  };

  const handleSelect = (type: 'year'|'month'|'day'|'hour'|'minute', val: number) => {
    let y = selectedYear;
    let m = selectedMonth;
    let d = selectedDay;
    let h = selectedHour;
    let min = selectedMinute;

    if (type === 'year') y = val;
    if (type === 'month') m = val;
    if (type === 'day') d = val;
    if (type === 'hour') h = val;
    if (type === 'minute') min = val;

    if (disableFutureDates) {
      if (y > now.getFullYear()) y = now.getFullYear();
      if (y === now.getFullYear() && m > now.getMonth() + 1) m = now.getMonth() + 1;
      
      const maxD = getDaysInMonth(new Date(y, m - 1));
      if (d > maxD) d = maxD;
      if (y === now.getFullYear() && m === now.getMonth() + 1 && d > now.getDate()) d = now.getDate();
      
      if (showTime && y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate()) {
        if (h > now.getHours()) h = now.getHours();
        if (h === now.getHours() && min > now.getMinutes()) min = now.getMinutes();
      }
    } else if (disablePastDates) {
      if (y < now.getFullYear()) y = now.getFullYear();
      if (y === now.getFullYear() && m < now.getMonth() + 1) m = now.getMonth() + 1;
      
      const maxD = getDaysInMonth(new Date(y, m - 1));
      if (d > maxD) d = maxD;
      if (y === now.getFullYear() && m === now.getMonth() + 1 && d < now.getDate()) d = now.getDate();
      
      if (showTime && y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate()) {
        if (h < now.getHours()) h = now.getHours();
        if (h === now.getHours() && min < now.getMinutes()) min = now.getMinutes();
      }
    } else {
      const maxD = getDaysInMonth(new Date(y, m - 1));
      if (d > maxD) d = maxD;
    }

    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
    setSelectedHour(h);
    setSelectedMinute(min);

    if (onChange) {
      onChange(new Date(y, m - 1, d, showTime ? h : 0, showTime ? min : 0));
    }
  };

  return (
    <div className="flex h-64 w-full bg-white rounded-md overflow-hidden">
      <Column label="Ngày" items={days} value={selectedDay} onChange={(v) => handleSelect('day', v)} isDisabled={isDayDisabled} />
      <Column label="Tháng" items={months} value={selectedMonth} onChange={(v) => handleSelect('month', v)} isDisabled={isMonthDisabled} />
      <Column label="Năm" items={years} value={selectedYear} onChange={(v) => handleSelect('year', v)} padZero={false} isDisabled={isYearDisabled} />
      {showTime && (
        <>
          <Column label="Giờ" items={hours} value={selectedHour} onChange={(v) => handleSelect('hour', v)} isDisabled={isHourDisabled} />
          <Column label="Phút" items={minutes} value={selectedMinute} onChange={(v) => handleSelect('minute', v)} isDisabled={isMinuteDisabled} />
        </>
      )}
    </div>
  );
};
