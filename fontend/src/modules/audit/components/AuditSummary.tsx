import React from 'react';
import { Activity, Clock, AlertTriangle, Shield } from 'lucide-react';
import { StatCard } from '@/common/components/ui/StatCard';

interface AuditSummaryProps {
  totalLogs: number;
  todayLogs: number;
  criticalActions: number;
  activeUsers: number;
}

export const AuditSummary: React.FC<AuditSummaryProps> = ({
  totalLogs,
  todayLogs,
  criticalActions,
  activeUsers
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Tổng số log"
        value={totalLogs}
        icon={<Activity />}
        color="blue"
      />
      <StatCard
        title="Log hôm nay"
        value={todayLogs}
        icon={<Clock />}
        color="emerald"
      />
      <StatCard
        title="Hành động quan trọng"
        value={criticalActions}
        icon={<AlertTriangle />}
        color="amber"
      />
      <StatCard
        title="Người dùng hoạt động"
        value={activeUsers}
        icon={<Shield />}
        color="purple"
      />
    </div>
  );
};
