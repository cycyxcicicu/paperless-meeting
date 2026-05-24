import React from 'react';
import { MapPin, Users, CheckCircle2, Clock } from 'lucide-react';

interface LocationSummaryProps {
  totalLocations: number;
  totalCapacity: number;
  activeLocations: number;
}

export const LocationSummary: React.FC<LocationSummaryProps> = ({
  totalLocations,
  totalCapacity,
  activeLocations
}) => {
  const stats = [
    {
      label: 'Tổng số địa điểm',
      value: totalLocations,
      icon: MapPin,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Tổng sức chứa',
      value: totalCapacity,
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      suffix: 'chỗ ngồi'
    },
    {
      label: 'Đang hoạt động',
      value: activeLocations,
      icon: CheckCircle2,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-11 h-11 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1 body">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl heading text-gray-900">{stat.value.toLocaleString()}</p>
              {stat.suffix && (
                <span className="text-xs text-gray-400 caption">{stat.suffix}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
