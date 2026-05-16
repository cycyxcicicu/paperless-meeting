import React from 'react';
import {
  MapPin,
  Users,
  Wifi,
  Monitor,
  Coffee,
  Edit3,
  Trash2,
  Eye,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Building2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface MeetingLocation {
  id: string;
  name: string;
  code: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[];
  status: 'active' | 'inactive';
  lastUsed?: string;
}

interface LocationTableProps {
  locations: MeetingLocation[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  currentPage: number;
  pageSize: number;
}

const facilityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  projector: Monitor,
  coffee: Coffee,
};

export const LocationTable: React.FC<LocationTableProps> = ({
  locations,
  onEdit,
  onDelete,
  onView,
  currentPage,
  pageSize,
}) => {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-3.5 text-left">
                <span className="text-xs heading text-gray-500 uppercase tracking-wider">
                  STT
                </span>
              </th>
              <th className="px-6 py-3.5 text-left">
                <span className="text-xs heading text-gray-500 uppercase tracking-wider">
                  Tên phòng họp
                </span>
              </th>
              <th className="px-6 py-3.5 text-left">
                <span className="text-xs heading text-gray-500 uppercase tracking-wider">
                  Vị trí
                </span>
              </th>
              <th className="px-6 py-3.5 text-center">
                <span className="text-xs heading text-gray-500 uppercase tracking-wider">
                  Sức chứa
                </span>
              </th>


              <th className="px-6 py-3.5 text-center">
                <span className="text-xs heading text-gray-500 uppercase tracking-wider">
                  Thao tác
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {locations.map((location, index) => {
              const absoluteIndex = (currentPage - 1) * pageSize + index + 1;

              return (
                <tr
                  key={location.id}
                  className="group hover:bg-gray-50/50 transition-colors"
                >
                  {/* Index */}
                  <td className="px-6 py-4">
                    <span className="text-sm btn-primary text-gray-400 font-mono">
                      {String(absoluteIndex).padStart(2, '0')}
                    </span>
                  </td>

                  {/* Location Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm heading text-gray-900 group-hover:text-[#C8102E] transition-colors truncate">
                          {location.name}
                        </span>
                        <code className="text-xs text-gray-400 body">
                          {location.code}
                        </code>
                      </div>
                    </div>
                  </td>

                  {/* Location Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="body">{location.building}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{location.floor}</span>
                    </div>
                  </td>

                  {/* Capacity */}
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 btn-primary text-sm">
                      <Users className="h-3.5 w-3.5" />
                      {location.capacity}
                    </div>
                  </td>





                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onView(location.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(location.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition-all"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(location.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {locations.length === 0 && (
        <div className="py-16 text-center">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500 body">
            Không tìm thấy địa điểm họp nào
          </p>
        </div>
      )}
    </div>
  );
};
