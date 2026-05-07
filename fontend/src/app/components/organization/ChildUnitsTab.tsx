import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  ChevronRight,
  Phone,
  Users,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ChildUnit {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  totalMembers: number;
  isActive: boolean;
}

interface ChildUnitsTabProps {
  units: ChildUnit[];
  onAdd?: () => void;
  onEdit?: (unitId: number) => void;
  onDelete?: (unitId: number) => void;
}

export const ChildUnitsTab: React.FC<ChildUnitsTabProps> = ({
  units,
  onAdd,
  onEdit,
  onDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter units by name
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return units;
    const query = searchQuery.toLowerCase();
    return units.filter(unit =>
      unit.name.toLowerCase().includes(query)
    );
  }, [units, searchQuery]);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Toolbar */}
      <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="relative flex-1 group mr-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-[#C8102E] transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm đơn vị con theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
          />
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white font-bold text-sm hover:shadow-lg transition-all shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Thêm mới
        </button>
      </div>

      {/* Grid List */}
      <div className="p-8">
        {filteredUnits.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredUnits.map((unit) => (
              <div 
                key={unit.id}
                className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-[#C8102E]/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                {/* Status Bar */}
                <div className={cn(
                  "absolute top-0 left-0 w-1.5 h-full transition-colors",
                  unit.isActive ? "bg-emerald-500" : "bg-gray-300"
                )} />
                
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#C8102E]/5 group-hover:text-[#C8102E] transition-colors border border-gray-100">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-[#C8102E] transition-colors">{unit.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{unit.code}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                          unit.isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-400 bg-gray-50"
                        )}>
                          {unit.isActive ? "Hoạt động" : "Tạm ngưng"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3.5 mb-6">
                  <div className="flex items-start gap-2.5 text-sm text-gray-500">
                    <div className="p-1 rounded bg-gray-100 text-gray-400 shrink-0">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">{unit.phone}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm text-gray-500">
                    <div className="p-1 rounded bg-gray-100 text-gray-400 shrink-0">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">{unit.totalMembers} nhân sự chuyên trách</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit?.(unit.id)}
                      className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1.5 group/btn"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Sửa
                    </button>
                    <button
                      onClick={() => onDelete?.(unit.id)}
                      className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1.5 group/btn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </div>
                  <button className="text-sm font-bold text-[#C8102E] hover:text-[#A90F14] transition-colors flex items-center gap-1 group/btn">
                    Xem chi tiết
                    <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-gray-200 mb-6 shadow-sm">
              <Building2 className="h-10 w-10" />
            </div>
            {searchQuery ? (
              <>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy kết quả</h4>
                <p className="text-gray-500 max-w-xs text-center font-medium">
                  Không tìm thấy đơn vị nào phù hợp với từ khóa "{searchQuery}"
                </p>
              </>
            ) : (
              <>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Chưa có đơn vị con</h4>
                <p className="text-gray-500 max-w-xs text-center font-medium">
                  Hiện tại chưa có đơn vị cấp dưới nào được khởi tạo trong hệ thống cho tổ chức này.
                </p>
                <button
                  onClick={onAdd}
                  className="mt-8 flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C8102E] text-white font-bold hover:bg-[#A90F14] transition-all shadow-lg shadow-[#C8102E]/20"
                >
                  <Plus className="h-5 w-5" />
                  Thêm đơn vị mới
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
