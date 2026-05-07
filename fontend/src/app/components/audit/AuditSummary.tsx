import React from 'react';
import { Activity, Clock, AlertTriangle, Shield } from 'lucide-react';

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
  const stats = [
    {
      label: 'Tổng số log',
      value: totalLogs,
      icon: Activity,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100/50',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      label: 'Log hôm nay',
      value: todayLogs,
      icon: Clock,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100/50',
      iconBg: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    {
      label: 'Hành động quan trọng',
      value: criticalActions,
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100/50',
      iconBg: 'bg-amber-500',
      textColor: 'text-amber-600'
    },
    {
      label: 'Người dùng hoạt động',
      value: activeUsers,
      icon: Shield,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100/50',
      iconBg: 'bg-purple-500',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-5 border border-gray-200/60 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.bgGradient} rounded-full opacity-20 group-hover:scale-125 transition-transform duration-500`} />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-gray-900">
                {stat.value.toLocaleString()}
              </p>
            </div>
            <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
