import React from 'react';
import { Briefcase, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatCard } from '@/common/components/ui/StatCard';

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
      <StatCard
        title="Tổng số chức vụ"
        value={totalPositions}
        icon={<Briefcase />}
        color="blue"
        description="Danh mục hệ thống"
      />
      <StatCard
        title="Nhân sự đảm nhiệm"
        value={totalUsers}
        icon={<Users />}
        color="emerald"
        description="Số lượng cán bộ"
      />
      <StatCard
        title="Đang hoạt động"
        value={activePositions}
        icon={<CheckCircle2 />}
        color="amber"
      />
      <StatCard
        title="Ngừng hoạt động"
        value={inactivePositions}
        icon={<AlertCircle />}
        color="rose"
      />
    </div>
  );
};
