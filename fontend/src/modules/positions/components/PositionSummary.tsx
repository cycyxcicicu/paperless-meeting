import React from 'react';
import { Briefcase, Users } from 'lucide-react';
import { StatCard } from '@/common/components/ui/StatCard';

interface PositionSummaryProps {
  totalPositions: number;
  totalUsers: number;
}

export const PositionSummary: React.FC<PositionSummaryProps> = ({
  totalPositions,
  totalUsers
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
    </div>
  );
};
