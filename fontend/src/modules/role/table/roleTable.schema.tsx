import React from 'react';
import { Eye, Edit, Trash2, Key } from 'lucide-react';
import { ColumnDef, TableActionDef, FilterDef, BadgeList, TableTooltip } from '@/common/components/table-engine';

export interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  userCount?: number;
  permissions?: string[];
}

// Map permission key -> label hiển thị
const PERMISSION_LABELS: Record<string, string> = {
  'view_dashboard': 'Xem Dashboard',
  'manage_users': 'QĐ ND',
  'manage_roles': 'QĐ Vai trò',
  'create_meeting': 'Tạo cuộc họp',
  'edit_meeting': 'Sửa cuộc họp',
  'delete_meeting': 'Xóa cuộc họp',
  'view_documents': 'Xem TL',
  'upload_documents': 'Tải lên TL',
  'manage_settings': 'QĐ Cài đặt',
};

export const getRoleTableColumns = (): ColumnDef<Role>[] => [
  {
    key: 'name',
    header: 'Tên vai trò',
    render: (row) => (
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm btn-primary text-gray-900">{row.name}</span>
          {row.isSystem && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs btn-primary rounded-full bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200">
              <Key className="h-3 w-3" />
              Hệ thống
            </span>
          )}
        </div>
        {row.userCount !== undefined && (
          <p className="text-xs text-gray-500 mt-1">{row.userCount} người dùng</p>
        )}
      </div>
    ),
  },
  {
    key: 'code',
    header: 'Mã vai trò',
    render: (row) => (
      <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">{row.code}</code>
    ),
  },
  {
    key: 'permissions',
    header: 'Quyền hạn',
    render: (row) => (
      <BadgeList
        items={(row.permissions || []).map(p => ({ key: p, label: PERMISSION_LABELS[p] || p }))}
        maxVisible={2}
        emptyText="Chưa gán"
      />
    ),
  },
  {
    key: 'description',
    header: 'Mô tả',
    render: (row) => (
      <TableTooltip text={row.description} maxLength={60} />
    ),
  },
];

export const getRoleRowActions = (
  onView: (role: Role) => void,
  onEdit: (role: Role) => void,
  onDelete: (role: Role) => void
): TableActionDef<Role>[] => [
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

export const getRoleFilters = (): FilterDef[] => [
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
];

export const getRoleFilterLabel = (key: string, value: string): string => {
  if (value === 'all') return '';
  if (key === 'status') return `Trạng thái: ${value === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}`;
  return `${key}: ${value}`;
};
