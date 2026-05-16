import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  Users,
  Edit,
  Trash2,
  User
} from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Pagination } from '@/common/components/ui/app-pagination';

interface ChildUnit {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  email?: string;
  director?: string;
  totalMembers: number;
  totalChildUnits?: number;
  foundedDate: string;
  isActive: boolean;
}

interface ChildUnitsTabProps {
  units: ChildUnit[];
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
    <div className="flex flex-col h-full">
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
                className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-[#C8102E]/20 transition-all duration-500 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Decorative background icon */}
                <Building2 className="absolute -right-4 -bottom-4 h-32 w-32 text-gray-50/50 -rotate-12 group-hover:text-[#C8102E]/5 transition-colors duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#C8102E] group-hover:text-white transition-all duration-300 shadow-sm border border-gray-100">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="heading text-gray-900 text-lg leading-tight group-hover:text-[#C8102E] transition-colors line-clamp-1" title={unit.name}>
                          {unit.name}
                        </h4>
                        <span className="font-mono text-[11px] text-gray-400 uppercase tracking-widest bg-gray-100/50 px-2 py-0.5 rounded-lg mt-1 inline-block">
                          {unit.code}
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm shrink-0",
                      unit.isActive 
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-100" 
                        : "text-gray-400 bg-gray-50 border border-gray-100"
                    )}>
                      {unit.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                    </div>
                  </div>

                  {/* Essential Stats - Balanced Layout */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-[#C8102E]/60 border border-gray-100">
                        <Users className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">Nhân sự</p>
                        <p className="heading text-gray-700 text-sm">{unit.totalMembers}</p>
                      </div>
                    </div>

                    {unit.director && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-blue-500/60 border border-gray-100">
                          <User className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">Người đứng đầu</p>
                          <p className="heading text-gray-700 text-sm line-clamp-1">{unit.director}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-5 border-t border-gray-100 relative z-10">
                  <button
                    onClick={() => onEdit?.(unit.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs heading text-amber-600 bg-amber-50/50 hover:bg-amber-100 transition-all border border-amber-100/50 shadow-sm"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => onDelete?.(unit.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs heading text-red-600 bg-red-50/50 hover:bg-red-100 transition-all border border-red-100/50 shadow-sm"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa bỏ
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
