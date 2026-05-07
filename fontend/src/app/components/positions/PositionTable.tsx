import React from 'react';
import {
  Briefcase,
  Users,
  ChevronRight,
  Edit3,
  Trash2,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Hash
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Position {
  id: string;
  name: string;
  code: string;
  description: string;
  memberCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface PositionTableProps {
  positions: Position[];
  selectedPositions: string[];
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  currentPage: number;
  pageSize: number;
}

export const PositionTable: React.FC<PositionTableProps> = ({
  positions,
  selectedPositions,
  onToggleSelectAll,
  onToggleSelect,
  onEdit,
  onDelete,
  onView,
  currentPage,
  pageSize,
}) => {
  const isAllSelected = positions.length > 0 && selectedPositions.length === positions.length;

  return (
    <div className="overflow-x-auto relative min-h-[400px]">
      <table className="w-full border-separate border-spacing-y-2 px-6">
        <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
          <tr className="text-left">
            <th className="w-12 py-3 pl-4 pr-2">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="w-5 h-5 rounded-lg border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer accent-[#C8102E] transition-all"
                />
              </div>
            </th>
            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              STT
            </th>
            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Thông tin chức vụ
            </th>
            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
              Số nhân sự
            </th>
            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="before:block before:h-2">
          {positions.map((position, index) => {
            const isSelected = selectedPositions.includes(position.id);
            const absoluteIndex = (currentPage - 1) * pageSize + index + 1;

            return (
              <tr
                key={position.id}
                className={cn(
                  "group transition-all duration-200",
                  isSelected ? "bg-red-50/50" : "hover:shadow-sm"
                )}
              >
                {/* Checkbox */}
                <td className={cn(
                  "py-4 pl-4 pr-2 rounded-l-2xl border-y border-l transition-colors duration-300",
                  isSelected ? "border-red-100" : "border-gray-100"
                )}>
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(position.id)}
                      className="w-5 h-5 rounded-lg border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer accent-[#C8102E] transition-all"
                    />
                  </div>
                </td>

                {/* Index */}
                <td className={cn(
                  "px-4 py-4 border-y transition-colors duration-300",
                  isSelected ? "border-red-100" : "border-gray-100"
                )}>
                  <span className="text-sm font-bold text-gray-400 font-mono">
                    {String(absoluteIndex).padStart(2, '0')}
                  </span>
                </td>

                {/* Position Info */}
                <td className={cn(
                  "px-4 py-4 border-y transition-colors duration-300",
                  isSelected ? "border-red-100" : "border-gray-100"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm",
                      isSelected ? "bg-[#C8102E] text-white" : "bg-white border border-gray-100 text-gray-400 group-hover:text-[#C8102E] group-hover:border-red-100"
                    )}>
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-[#C8102E] transition-colors truncate">
                          {position.name}
                        </span>
                        <code className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-wider shrink-0 border border-gray-200/50">
                          {position.code}
                        </code>
                      </div>
                      <span className="text-xs text-gray-500 line-clamp-1">
                        {position.description}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Member Count */}
                <td className={cn(
                  "px-4 py-4 border-y text-center transition-colors duration-300",
                  isSelected ? "border-red-100" : "border-gray-100"
                )}>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-700 font-bold text-sm shadow-sm transition-transform hover:scale-105">
                    <Users className="h-3.5 w-3.5" />
                    {position.memberCount}
                  </div>
                </td>

                {/* Status */}
                <td className={cn(
                  "px-4 py-4 border-y text-center transition-colors duration-300",
                  isSelected ? "border-red-100" : "border-gray-100"
                )}>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm transition-all duration-300",
                    position.status === 'active' 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                  )}>
                    {position.status === 'active' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {position.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </td>

                {/* Actions */}
                <td className={cn(
                  "px-4 py-4 border-y border-r rounded-r-2xl text-center transition-colors duration-300",
                  isSelected ? "border-red-100" : "border-gray-100"
                )}>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onView(position.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(position.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition-all"
                      title="Chỉnh sửa"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(position.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
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
  );
};
