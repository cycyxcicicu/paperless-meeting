import React from 'react';
import {
  User,
  Monitor,
  Calendar,
  FileText,
  Trash2,
  Edit3,
  Eye,
  Plus,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

interface AuditTableProps {
  logs: AuditLog[];
  currentPage: number;
  pageSize: number;
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
  low: { icon: CheckCircle, color: 'text-gray-400' },
  medium: { icon: AlertCircle, color: 'text-blue-500' },
  high: { icon: AlertCircle, color: 'text-amber-500' },
  critical: { icon: AlertCircle, color: 'text-red-500' }
};

export const AuditTable: React.FC<AuditTableProps> = ({
  logs,
  currentPage,
  pageSize
}) => {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left">
                <span className="text-xs heading text-gray-600 uppercase tracking-wider">
                  STT
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs heading text-gray-600 uppercase tracking-wider">
                  Người dùng
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs heading text-gray-600 uppercase tracking-wider">
                  IP Address
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs heading text-gray-600 uppercase tracking-wider">
                  Hành động
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs heading text-gray-600 uppercase tracking-wider">
                  Đối tượng
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs heading text-gray-600 uppercase tracking-wider">
                  Mô tả
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="text-xs heading text-gray-600 uppercase tracking-wider">
                  Thời gian
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log, index) => {
              const absoluteIndex = (currentPage - 1) * pageSize + index + 1;
              const actionInfo = actionConfig[log.action];
              const ActionIcon = actionInfo.icon;
              const SeverityIcon = log.severity ? severityConfig[log.severity].icon : null;

              return (
                <tr
                  key={log.id}
                  className="group hover:bg-gray-50/50 transition-colors"
                >
                  {/* Index */}
                  <td className="px-4 py-3">
                    <span className="text-sm btn-primary text-gray-400 font-mono">
                      {String(absoluteIndex).padStart(3, '0')}
                    </span>
                  </td>

                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm btn-primary text-gray-900 truncate">
                          {log.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.userRole}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* IP Address */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <code className="text-xs font-mono btn-primary text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {log.ipAddress}
                      </code>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs heading rounded-lg border',
                        actionInfo.bg,
                        actionInfo.color,
                        actionInfo.border
                      )}
                    >
                      <ActionIcon className="h-3 w-3" />
                      {actionInfo.label}
                    </span>
                  </td>

                  {/* Object Type */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs btn-primary text-gray-600 uppercase tracking-wide">
                        {log.objectType}
                      </span>
                      <span className="text-sm body text-gray-900 truncate max-w-[200px]">
                        {log.objectName}
                      </span>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      {SeverityIcon && log.severity && (
                        <SeverityIcon className={cn('h-4 w-4 shrink-0 mt-0.5', severityConfig[log.severity].color)} />
                      )}
                      <span className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {log.description}
                      </span>
                    </div>
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm btn-primary text-gray-900">
                        {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && (
        <div className="py-16 text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500 body">
            Không tìm thấy log nào
          </p>
        </div>
      )}
    </div>
  );
};
