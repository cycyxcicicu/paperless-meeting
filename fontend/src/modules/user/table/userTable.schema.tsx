import React from 'react';
import { Mail, Phone, Eye, Edit, Trash2 } from 'lucide-react';
import { ColumnDef, TableActionDef, FilterDef, BulkActionDef, TableTooltip } from '@/common/components/table-engine';

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
    render: (row) => <TableTooltip text={row.position} maxLength={25} />,
  },
  {
    key: 'department',
    header: 'Đơn vị',
    render: (row) => <TableTooltip text={row.department} maxLength={30} />,
  },
  {
    key: 'status',
    header: 'Trạng thái',
    align: 'center',
    render: (row) => (
      <span className={`inline-flex items-center px-3 py-1 text-xs btn-primary rounded-full border ${
        row.status === 'active' 
          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200'
          : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border-gray-200'
      }`}>
        {row.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
      </span>
    ),
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
    key: 'role',
    label: 'Vai trò',
    type: 'select',
    options: [
      { value: 'all', label: 'Tất cả' },
      { value: 'admin', label: 'Admin' },
      { value: 'staff', label: 'Nhân viên' },
      { value: 'user', label: 'Người dùng' }
    ],
  },
  {
    key: 'status',
    label: 'Trạng thái',
    type: 'select',
    options: [
      { value: 'all', label: 'Tất cả' },
      { value: 'active', label: 'Hoạt động' },
      { value: 'inactive', label: 'Ngừng hoạt động' },
      { value: 'pending', label: 'Chờ duyệt' },
      { value: 'locked', label: 'Bị khóa' }
    ],
  },
  {
    key: 'unit',
    label: 'Đơn vị',
    type: 'searchable-select',
    searchPlaceholder: 'Tìm kiếm đơn vị...',
    options: [{ value: 'all', label: 'Tất cả' }, ...units.map(u => ({ value: String(u.id), label: u.name }))],
  }
];

// Hàm lấy Nhãn của filter đang chọn (để hiển thị Tag)
export const getUserFilterLabel = (key: string, value: string, units: any[]): string => {
  if (value === 'all') return '';
  if (key === 'role') return `Vai trò: ${value === 'admin' ? 'Admin' : value === 'staff' ? 'Nhân viên' : 'Người dùng'}`;
  if (key === 'status') return `Trạng thái: ${value === 'active' ? 'Hoạt động' : value === 'inactive' ? 'Ngừng hoạt động' : value === 'pending' ? 'Chờ duyệt' : 'Bị khóa'}`;
  if (key === 'unit') {
    const selectedUnit = units.find(u => String(u.id) === value);
    return `Đơn vị: ${selectedUnit?.name || value}`;
  }
  return `${key}: ${value}`;
};
