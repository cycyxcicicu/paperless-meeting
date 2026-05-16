import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Users,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Pagination } from '@/common/components/ui/app-pagination';

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
  /** Label for the type of child unit, e.g. "đơn vị trực thuộc", "phòng ban trực thuộc" */
  label?: string;
  onAdd?: () => void;
  onEdit?: (unitId: number) => void;
  onDelete?: (unitId: number) => void;
}

export const ChildUnitsTab: React.FC<ChildUnitsTabProps> = ({
  units,
  label = 'đơn vị trực thuộc',
  onAdd,
  onEdit,
  onDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  // Filter units by name
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return units;
    const query = searchQuery.toLowerCase();
    return units.filter(unit =>
      unit.name.toLowerCase().includes(query)
    );
  }, [units, searchQuery]);

  const totalItems = filteredUnits.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const currentData = filteredUnits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Toolbar */}
      <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="relative flex-1 group mr-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-[#C8102E] transition-colors" />
          <input
            type="text"
            placeholder={`Tìm kiếm ${label} theo tên...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
          />
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white heading text-sm hover:shadow-lg transition-all shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Thêm mới
        </button>
      </div>

      {/* Grid List */}
      <div className="p-8 flex-1 overflow-y-auto">
        {filteredUnits.length > 0 ? (
          <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            {currentData.map((unit) => (
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
                      <h4 className="heading text-gray-900 text-lg leading-tight mb-1 group-hover:text-[#C8102E] transition-colors">{unit.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="font-mono heading text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{unit.code}</span>
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
                    <span className="body">{unit.phone}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm text-gray-500">
                    <div className="p-1 rounded bg-gray-100 text-gray-400 shrink-0">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <span className="body">{unit.totalMembers} nhân sự chuyên trách</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-5 border-t border-gray-50">
                  <button
                    onClick={() => onEdit?.(unit.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm heading text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Sửa
                  </button>
                  <button
                    onClick={() => onDelete?.(unit.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm heading text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[4, 8, 12, 20]}
          />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-gray-200 mb-6 shadow-sm">
              <Building2 className="h-10 w-10" />
            </div>
            {searchQuery ? (
              <>
                <h4 className="text-xl heading text-gray-900 mb-2">Không tìm thấy kết quả</h4>
                <p className="text-gray-500 max-w-xs text-center body">
                  Không tìm thấy đơn vị nào phù hợp với từ khóa "{searchQuery}"
                </p>
              </>
            ) : (
              <>
                <h4 className="text-xl heading text-gray-900 mb-2">Chưa có {label} nào</h4>
                <p className="text-gray-500 max-w-xs text-center body">
                  Hiện tại chưa có {label} nào được khởi tạo trong hệ thống.
                </p>
                <button
                  onClick={onAdd}
                  className="mt-8 flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C8102E] text-white heading hover:bg-[#A90F14] transition-all shadow-lg shadow-[#C8102E]/20"
                >
                  <Plus className="h-5 w-5" />
                  Thêm {label} mới
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
