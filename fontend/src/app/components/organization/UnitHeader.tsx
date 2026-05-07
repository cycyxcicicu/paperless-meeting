import React from 'react';
import { 
  ArrowLeft, 
  Building2, 
  ChevronRight, 
  Edit, 
  Home, 
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '../../../lib/utils';

interface UnitHeaderProps {
  unitName: string;
  unitCode: string;
  isActive: boolean;
  parentName?: string;
  onEdit?: () => void;
  onAddChild?: () => void;
}

export const UnitHeader: React.FC<UnitHeaderProps> = ({
  unitName,
  unitCode,
  isActive,
  parentName,
  onEdit,
  onAddChild
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Breadcrumbs */}
      <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <button 
            onClick={() => navigate('/')}
            className="hover:text-[#C8102E] transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="hover:text-[#C8102E] cursor-pointer">Hệ thống</span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <button 
            onClick={() => navigate('/nguoi-dung/don-vi')}
            className="hover:text-[#C8102E] transition-colors"
          >
            Quản lý đơn vị
          </button>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="text-gray-900 font-semibold">{unitName}</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-all text-gray-600 group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C8102E] to-[#A90F14] flex items-center justify-center shadow-[0_8px_16px_rgba(200,16,46,0.15)] ring-4 ring-white">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{unitName}</h1>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm",
                    isActive 
                      ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" 
                      : "bg-gray-50 text-gray-400 ring-1 ring-gray-200"
                  )}>
                    {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">Mã đơn vị:</span>
                    <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider text-xs">{unitCode}</span>
                  </div>
                  {parentName && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-gray-400 font-medium">Cấp trên:</span>
                      <span className="font-semibold text-gray-700">{parentName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onAddChild}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Thêm đơn vị con
            </button>
            <button 
              onClick={onEdit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C8102E] text-white font-bold text-sm hover:bg-[#A90F14] transition-all shadow-[0_4px_12px_rgba(200,16,46,0.2)] active:scale-95"
            >
              <Edit className="h-4 w-4" />
              Chỉnh sửa
            </button>
            <button className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
