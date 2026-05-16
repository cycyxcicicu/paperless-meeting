import React from 'react';
import { Eye, Edit, Trash2, MapPin, Phone, Users } from 'lucide-react';
import { ColumnDef, TableActionDef, TableTooltip } from '@/common/components/table-engine';

export interface ChildUnit {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  totalMembers: number;
  isActive: boolean;
}

export const getChildUnitTableColumns = (): ColumnDef<ChildUnit>[] => [
  {
    key: 'name',
    header: 'Tên đơn vị',
    render: (row) => (
      <div>
        <TableTooltip text={row.name} maxLength={35} className="text-sm font-semibold text-gray-900" />
        <div className="text-xs text-gray-500 mt-0.5">Mã: {row.code}</div>
      </div>
    ),
  },
  {
    key: 'address',
    header: 'Địa chỉ',
    render: (row) => (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <TableTooltip text={row.address || 'Chưa cập nhật'} maxLength={30} />
      </div>
    ),
  },
  {
    key: 'phone',
    header: 'Số điện thoại',
    render: (row) => (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        {row.phone || 'Chưa cập nhật'}
      </div>
    ),
  },
  {
    key: 'totalMembers',
    header: 'Nhân sự',
    align: 'center',
    render: (row) => (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm btn-primary">
        <Users className="h-3.5 w-3.5" />
        {row.totalMembers || 0}
      </div>
    ),
  },
  {
    key: 'isActive',
    header: 'Trạng thái',
    align: 'center',
    render: (row) => (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs btn-primary rounded-full border ${
        row.isActive 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-gray-50 text-gray-600 border-gray-200'
      }`}>
        {row.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
      </span>
    ),
  },
];

export const getChildUnitRowActions = (
  onView: (unit: ChildUnit) => void,
  onEdit: (unit: ChildUnit) => void,
  onDelete: (unit: ChildUnit) => void
): TableActionDef<ChildUnit>[] => [
  {
    key: 'view',
    label: 'Xem chi tiết',
    icon: <Eye className="h-4 w-4" />,
    variant: 'primary',
    onClick: onView,
  },
  {
    key: 'edit',
    label: 'Chỉnh sửa',
    icon: <Edit className="h-4 w-4" />,
    variant: 'warning',
    onClick: onEdit,
  },
  {
    key: 'delete',
    label: 'Xóa',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'danger',
    onClick: onDelete,
  },
];
