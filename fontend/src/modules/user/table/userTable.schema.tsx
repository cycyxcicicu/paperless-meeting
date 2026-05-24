import React from 'react';
import { Mail, Phone, Eye, Edit, Trash2 } from 'lucide-react';
import { ColumnDef, TableActionDef, FilterDef, BulkActionDef, TableTooltip } from '@/common/components/table-engine';
import { BadgeStatus } from '@/common/components/ui/BadgeStatus';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: 'active' | 'inactive';
}

export type UserFormData = Omit<User, 'id'>;

// Hàm khởi tạo Cấu hình Cột
export const getUserTableColumns = (): ColumnDef<User>[] => [
  {
    key: 'username',
    header: 'Tên đăng nhập',
    render: (row) => <span className="text-sm btn-primary text-gray-900">{row.username}</span>,
  },
  {
    key: 'fullName',
    header: 'Họ và tên',
    render: (row) => <span className="text-sm text-gray-900">{row.fullName}</span>,
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Mail className="h-3.5 w-3.5 text-gray-400" />
        {row.email}
      </div>
    ),
  },
  {
    key: 'phone',
    header: 'Số điện thoại',
    render: (row) => (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Phone className="h-3.5 w-3.5 text-gray-400" />
        {row.phone}
      </div>
    ),
  },
  {
    key: 'position',
    header: 'Chức vụ',
    render: (row) => {
      let val = row.position;
      if (typeof val === 'object' && val !== null) {
        val = (val as any).positionName || (val as any).name || (val as any).title || '';
      }
      return <TableTooltip text={val as string} maxLength={25} />;
    }
  },
  {
    key: 'department',
    header: 'Đơn vị',
    render: (row) => {
      let val = row.department;
      if (typeof val === 'object' && val !== null) {
        val = (val as any).deptName || (val as any).name || (val as any).title || '';
      }
      return <TableTooltip text={val as string} maxLength={30} />;
    }
  },
  {
    key: 'status',
    header: 'Trạng thái',
    align: 'center',
    render: (row) => {
      const statusStr = String(row.status || '').toUpperCase();
      const isActive = statusStr === 'ACTIVE' || statusStr === '1' || statusStr === 'HOẠT ĐỘNG';
      return (
        <BadgeStatus 
          status={isActive ? 'success' : 'neutral'} 
          label={isActive ? 'Hoạt động' : 'Ngừng hoạt động'} 
        />
      );
    }
  },
];

// Hàm khởi tạo Các Nút Thao Tác (Xem, Sửa, Xóa)
export const getUserRowActions = (
  onView: (user: User) => void,
  onEdit: (user: User) => void,
  onDelete: (user: User) => void
): TableActionDef<User>[] => [
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

// Hàm khởi tạo Bộ lọc (Filters)
export const getUserFilters = (units: any[]): FilterDef[] => [
  {
    key: 'status',
    label: 'Trạng thái',
    type: 'select',
    options: [
      { value: 'all', label: 'Tất cả' },
      { value: 'active', label: 'Hoạt động' },
      { value: 'inactive', label: 'Ngừng hoạt động' },
    ],
  },
  {
    key: 'departmentId',
    label: 'Đơn vị',
    type: 'searchable-select',
    searchPlaceholder: 'Tìm kiếm đơn vị...',
    options: [{ value: 'all', label: 'Tất cả' }, ...units.map(u => ({ value: String(u.id), label: u.name }))],
  }
];

// Hàm lấy Nhãn của filter đang chọn (để hiển thị Tag)
export const getUserFilterLabel = (key: string, value: string, units: any[]): string => {
  if (value === 'all') return '';
  if (key === 'status') return `Trạng thái: ${value === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}`;
  if (key === 'departmentId') {
    const selectedUnit = units.find(u => String(u.id) === value);
    return `Đơn vị: ${selectedUnit?.name || value}`;
  }
  return `${key}: ${value}`;
};

