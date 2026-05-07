import React from 'react';
import { Briefcase, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SummaryItemProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'amber' | 'rose';
  description?: string;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, icon: Icon, color, description }) => {
  const colors = {
    blue: 'from-blue-50 to-blue-100/50 text-blue-600 border-blue-200/50',
    emerald: 'from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-200/50',
    amber: 'from-amber-50 to-amber-100/50 text-amber-600 border-amber-200/50',
    rose: 'from-rose-50 to-rose-100/50 text-rose-600 border-rose-200/50',
  };

  const iconColors = {
    blue: 'bg-blue-600 text-white shadow-blue-200',
    emerald: 'bg-emerald-600 text-white shadow-emerald-200',
    amber: 'bg-amber-600 text-white shadow-amber-200',
    rose: 'bg-rose-600 text-white shadow-rose-200',
  };

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative"
    )}>
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-bl-full transition-transform group-hover:scale-110",
        colors[color].split(' ')[0]
      )} />
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
            {description && <span className="text-xs text-gray-400 font-normal">{description}</span>}
          </div>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300",
          iconColors[color]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

interface PositionSummaryProps {
  totalPositions: number;
  totalUsers: number;
  activePositions: number;
  inactivePositions: number;
}

export const PositionSummary: React.FC<PositionSummaryProps> = ({
  totalPositions,
  totalUsers,
  activePositions,
  inactivePositions
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <SummaryItem
        label="Tổng số chức vụ"
        value={totalPositions}
        icon={Briefcase}
        color="blue"
        description="danh mục"
      />
      <SummaryItem
        label="Nhân sự đảm nhiệm"
        value={totalUsers}
        icon={Users}
        color="emerald"
        description="người"
      />
      <SummaryItem
        label="Đang hoạt động"
        value={activePositions}
        icon={CheckCircle2}
        color="amber"
      />
      <SummaryItem
        label="Ngừng hoạt động"
        value={inactivePositions}
        icon={AlertCircle}
        color="rose"
      />
    </div>
  );
};
