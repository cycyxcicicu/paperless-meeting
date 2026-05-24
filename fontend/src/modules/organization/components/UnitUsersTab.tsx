import React, { useMemo } from 'react';
import { Users, Plus } from 'lucide-react';
import { DataTable, DataToolbar } from '@/common/components/table-engine';
import { getUnitUserTableColumns, getUnitUserRowActions, UnitUser } from '../table/unitUserTable.schema';
import { useAuth } from '@/app/context/AuthContext';

interface UnitUsersTabProps {
  users: UnitUser[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (query: string) => void;
  onAdd?: () => void;
  onView?: (userId: number) => void;
  onEdit?: (userId: number) => void;
  onDelete?: (userId: number) => void;
}

export const UnitUsersTab: React.FC<UnitUsersTabProps> = ({
  users,
  totalItems,
  currentPage,
  pageSize,
  searchQuery,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onAdd,
  onView,
  onEdit,
  onDelete
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.roleCode === 'SUPER_ADMIN';

  const columns = useMemo(() => getUnitUserTableColumns(), []);

  const rowActions = useMemo(() => {
    return getUnitUserRowActions(
      (user) => onView?.(user.id),
      onEdit ? (user) => onEdit(user.id) : undefined,
      onDelete ? (user) => onDelete(user.id) : undefined,
      isSuperAdmin
    );
  }, [onView, onEdit, onDelete, isSuperAdmin]);

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="flex flex-col h-full bg-white">
      <DataToolbar
        searchPlaceholder="Tìm kiếm người dùng theo tên, email, số điện thoại..."
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        primaryAction={onAdd ? {
          label: 'Thêm mới',
          icon: <Plus className="h-4 w-4" />,
          onClick: onAdd
        } : undefined}
      />

      <div className="flex-1 p-6">
        <DataTable
          data={users}
          config={{
            columns,
            rowActions,
          }}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel="nhân sự"
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
                <Users className="h-10 w-10" />
              </div>
              <h4 className="text-xl heading text-gray-900 mb-2">
                {searchQuery ? 'Không tìm thấy kết quả' : 'Không tìm thấy nhân sự'}
              </h4>
              <p className="text-gray-500 max-w-xs text-center body">
                {searchQuery 
                  ? `Không tìm thấy nhân sự nào phù hợp với từ khóa "${searchQuery}"`
                  : 'Đơn vị này hiện chưa có nhân sự nào được gán quyền truy cập.'}
              </p>
              {!searchQuery && onAdd && (
                <button
                  onClick={onAdd}
                  className="mt-8 flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C8102E] text-white heading hover:bg-[#A90F14] transition-all shadow-lg shadow-[#C8102E]/20"
                >
                  <Plus className="h-5 w-5" />
                  Thêm mới
                </button>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
};

