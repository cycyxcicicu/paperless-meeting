import React from 'react';
import { ColumnDef, TableTooltip } from '@/common/components/table-engine';
import { 
  User, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';
import { cn } from '@/common/utils/cn';

export interface AuditLog {
  id: string;
  username: string;
  userRole: string;
  ipAddress: string;
  action: 'create' | 'update' | 'delete' | 'read';
  objectType: string;
  objectName: string;
  description: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const actionConfig = {
  create: {
    label: 'Tạo mới',
    icon: Plus,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200'
  },
  update: {
    label: 'Cập nhật',
    icon: Edit3,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  delete: {
    label: 'Xóa',
    icon: Trash2,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200'
  },
  read: {
    label: 'Xem',
    icon: Eye,
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200'
  }
};

const severityConfig = {
  low: { icon: CheckCircle, color: 'text-emerald-500' },       // Màu xanh lá cây thân thiện
  medium: { icon: AlertCircle, color: 'text-amber-500' },      // Màu vàng/cam cảnh báo tương ứng với box "Hành động quan trọng"
  high: { icon: AlertCircle, color: 'text-orange-500' },       // Màu cam đậm
  critical: { icon: AlertCircle, color: 'text-red-500' }       // Màu đỏ nguy hiểm
};

export const getAuditTableColumns = (): ColumnDef<AuditLog>[] => [
  {
    key: 'username',
    header: 'Người dùng',
    width: '200px',
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-gray-500" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate">
            {row.username}
          </span>
          <span className="text-xs text-gray-500">
            {row.userRole}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: 'action',
    header: 'Hành động',
    width: '120px',
    className: 'whitespace-nowrap',
    headerClassName: 'whitespace-nowrap',
    render: (row) => {
      const actionInfo = actionConfig[row.action];
      const ActionIcon = actionInfo.icon;
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border whitespace-nowrap',
            actionInfo.bg,
            actionInfo.color,
            actionInfo.border
          )}
        >
          <ActionIcon className="h-3 w-3" />
          {actionInfo.label}
        </span>
      );
    },
  },
  {
    key: 'object',
    header: 'Đối tượng',
    width: '180px',
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {row.objectType}
        </span>
        <TableTooltip text={row.objectName || ''} maxLength={40} />
      </div>
    ),
  },
  {
    key: 'description',
    header: 'Mô tả',
    // Cột mô tả sẽ linh hoạt chiếm khoảng trống còn lại
    render: (row) => {
      const SeverityIcon = row.severity ? severityConfig[row.severity].icon : null;
      return (
        <div className="flex items-center gap-2">
          {SeverityIcon && row.severity && (
            <SeverityIcon className={cn('h-4 w-4 shrink-0', severityConfig[row.severity].color)} />
          )}
          <TableTooltip text={row.description || ''} maxLength={70} />
        </div>
      );
    },
  },
  {
    key: 'timestamp',
    header: 'Thời gian',
    width: '130px',
    headerClassName: 'text-right',
    render: (row) => (
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-gray-900">
          {new Date(row.timestamp).toLocaleDateString('vi-VN')}
        </span>
        <span className="text-xs text-gray-500 font-mono">
          {new Date(row.timestamp).toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </span>
      </div>
    ),
  },
];
