import { Mail, Phone, Eye, Edit, Trash2, Shield, UserCheck } from 'lucide-react';
import { ColumnDef, TableActionDef } from '@/common/components/table-engine';
import { cn } from '@/common/utils/cn';
import { BadgeStatus } from '@/common/components/ui/BadgeStatus';

export interface UnitUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  role: any;
  position: any;
}

export const getUnitUserTableColumns = (): ColumnDef<UnitUser>[] => [
  {
    key: 'fullName',
    header: 'Họ và tên / Tài khoản',
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 text-sm btn-primary border-2 border-white shadow-sm ring-1 ring-gray-100">
          {row.fullName.split(' ').pop()?.charAt(0)}
        </div>
        <div>
          <div className="text-sm btn-primary text-gray-900 group-hover:text-[#C8102E] transition-colors">{row.fullName}</div>
          <div className="text-xs body text-gray-500">@{row.username}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'position',
    header: 'Chức vụ / Vai trò',
    render: (row) => {
      let posVal = row.position;
      if (typeof posVal === 'object' && posVal !== null) {
        posVal = posVal.positionName || posVal.name || '';
      }
      let roleVal = row.role;
      if (typeof roleVal === 'object' && roleVal !== null) {
        roleVal = roleVal.roleName || roleVal.name || roleVal.roleCode || '';
      }
      return (
        <div className="flex flex-col gap-1.5">
          <div className="text-sm body text-gray-700 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-gray-400" />
            {(posVal as string) || 'Chưa cập nhật'}
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs btn-primary text-[#C8102E] bg-[#C8102E]/5 px-2 py-0.5 rounded-md w-fit">
            <Shield className="h-3 w-3" />
            {(roleVal as string) || 'N/A'}
          </div>
        </div>
      );
    },
  },
  {
    key: 'contact',
    header: 'Liên hệ',
    render: (row) => (
      <div className="flex flex-col gap-1.5">
        <div className="text-sm body text-gray-600 flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-gray-400" />
          {row.email}
        </div>
        <div className="text-sm body text-gray-600 flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-gray-400" />
          {row.phone}
        </div>
      </div>
    ),
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
    },
  },
];

export const getUnitUserRowActions = (
  onView: (user: UnitUser) => void,
  onEdit?: (user: UnitUser) => void,
  onDelete?: (user: UnitUser) => void,
  isSuperAdmin?: boolean
): TableActionDef<UnitUser>[] => {
  const actions: TableActionDef<UnitUser>[] = [
    {
      key: 'view',
      label: 'Xem chi tiết',
      icon: <Eye className="h-4 w-4" />,
      variant: 'primary',
      onClick: onView,
    }
  ];

  if (onEdit) {
    actions.push({
      key: 'edit',
      label: 'Chỉnh sửa',
      icon: <Edit className="h-4 w-4" />,
      variant: 'warning',
      onClick: onEdit,
      show: (row) => !isSuperAdmin || row.role?.roleCode === 'DEPARTMENT_ADMIN',
    });
  }

  if (onDelete) {
    actions.push({
      key: 'delete',
      label: 'Xóa',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: onDelete,
      show: (row) => !isSuperAdmin || row.role?.roleCode === 'DEPARTMENT_ADMIN',
    });
  }

  return actions;
};
