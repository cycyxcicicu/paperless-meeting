import React from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  FileText,
  Info,
  ShieldCheck
} from 'lucide-react';

interface UnitInfo {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  establishedDate: string;
  director: string;
  contactPerson: string;
  description: string;
  isActive: boolean;
  totalMembers: number;
}

interface UnitInfoTabProps {
  unit: UnitInfo;
}

export const UnitInfoTab: React.FC<UnitInfoTabProps> = ({ unit }) => {
  const InfoField = ({ label, value, className = "" }: { label: string; value: string | React.ReactNode; className?: string }) => (
    <div className={className}>
      <div className="text-xs body text-gray-500 mb-1.5">{label}</div>
      <div className="text-sm btn-primary text-gray-900">{value}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Thông tin chung */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm btn-primary text-gray-900 mb-4 flex items-center gap-2">
          <Info className="h-4 w-4 text-[#C8102E]" />
          Thông tin chung
        </h3>
        <div className="grid grid-cols-4 gap-6">
          <InfoField label="Tên đơn vị" value={unit.name} />
          <InfoField label="Mã định danh" value={<code className="text-sm font-mono heading text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{unit.code}</code>} />
          <InfoField label="Ngày thành lập" value={unit.establishedDate} />
          <InfoField
            label="Trạng thái"
            value={
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs btn-primary ${
                unit.isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {unit.isActive ? "Đang hoạt động" : "Tạm ngưng"}
              </span>
            }
          />
        </div>
      </div>

      {/* Thông tin liên hệ */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm btn-primary text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#C8102E]" />
          Thông tin liên hệ
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <InfoField label="Số điện thoại" value={unit.phone} />
            <InfoField label="Email công vụ" value={unit.email} />
          </div>
          <div className="pt-3 border-t border-gray-100">
            <InfoField label="Địa chỉ trụ sở" value={unit.address} />
          </div>
        </div>
      </div>

      {/* Nhân sự lãnh đạo */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm btn-primary text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-[#C8102E]" />
          Nhân sự lãnh đạo
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <InfoField label="Người đứng đầu" value={unit.director} />
          <InfoField label="Người phụ trách liên hệ" value={unit.contactPerson} />
          <InfoField label="Tổng số cán bộ" value={`${unit.totalMembers} nhân sự`} />
        </div>
      </div>

      {/* Mô tả chức năng, nhiệm vụ */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm btn-primary text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#C8102E]" />
          Mô tả chức năng, nhiệm vụ
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {unit.description || "Chưa có mô tả chi tiết cho đơn vị này."}
        </p>
      </div>
    </div>
  );
};
