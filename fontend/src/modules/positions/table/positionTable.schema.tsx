import { Eye, Edit, Trash2 } from 'lucide-react';
import { ColumnDef, TableActionDef, TableTooltip } from '@/common/components/table-engine';

export interface Position {
  id: string;
  name: string;
  code: string;
  description: string;
  memberCount: number;
  status: 'active' | 'inactive';
  rankOrder: number;
  isLeadership: boolean;
  createdAt: string;
}

export const getPositionTableColumns = (): ColumnDef<Position>[] => [
  {
    key: 'name',
    header: 'Tên chức vụ',
    render: (row) => (
      <div className="font-medium text-gray-900">{row.name}</div>
    ),
  },
  {
    key: 'code',
    header: 'Mã chức vụ',
    render: (row) => (
      <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
        {row.code}
      </code>
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

export const getPositionRowActions = (
  onView: (row: Position) => void,
  onEdit: (row: Position) => void,
  onDelete: (row: Position) => void
): TableActionDef<Position>[] => [
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
