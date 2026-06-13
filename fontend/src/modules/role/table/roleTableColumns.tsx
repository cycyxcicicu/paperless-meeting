
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ColumnDef, TableActionDef, FilterDef, BadgeList } from '@/common/components/table-engine';

export interface Role {
  id: string;
  roleName: string;
  roleCode: string;
  permCodes?: string[];
}

export const getRoleTableColumns = (permissionMap: Record<string, string> = {}): ColumnDef<Role>[] => [
  {
    key: 'roleName',
    header: 'Tên vai trò',
    render: (row) => (
      <div>
        <span className="text-sm font-medium text-gray-900">{row.roleName}</span>
      </div>
    ),
  },
  {
    key: 'roleCode',
    header: 'Mã vai trò',
    render: (row) => (
      <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">{row.roleCode}</code>
    ),
  },
  // {
  //   key: 'permCodes',
  //   header: 'Quyền hạn',
  //   render: (row) => (
  //     <BadgeList
  //       items={(row.permCodes || []).map(p => ({ key: p, label: permissionMap[p] || p }))}
  //       maxVisible={2}
  //       emptyText="Chưa gán"
  //     />
  //   ),
  // },
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

export const getRoleFilters = (): FilterDef[] => [];

export const getRoleFilterLabel = (key: string, value: string): string => {
  return `${key}: ${value}`;
};
