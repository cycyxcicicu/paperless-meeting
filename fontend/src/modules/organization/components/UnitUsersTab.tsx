import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus } from 'lucide-react';
import { DataTable, DataToolbar } from '@/common/components/table-engine';
import { getUnitUserTableColumns, getUnitUserRowActions, UnitUser } from '../table/unitUserTable.schema';

interface UnitUsersTabProps {
  users: UnitUser[];
  onAdd?: () => void;
  onView?: (userId: number) => void;
  onEdit?: (userId: number) => void;
  onDelete?: (userId: number) => void;
}

export const UnitUsersTab: React.FC<UnitUsersTabProps> = ({
  users,
  onAdd,
  onView,
  onEdit,
  onDelete
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset to first page when users change
  useEffect(() => {
    setCurrentPage(1);
  }, [users]);

  // Reset to first page when search or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const columns = useMemo(() => getUnitUserTableColumns(), []);

  const rowActions = useMemo(() => {
    return getUnitUserRowActions(
      (user) => onView?.(user.id),
      (user) => onEdit?.(user.id),
      (user) => onDelete?.(user.id)
    );
  }, [onView, onEdit, onDelete]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user =>
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentData = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <DataToolbar
        searchPlaceholder="Tìm kiếm người dùng theo tên, email, số điện thoại..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        primaryAction={{
          label: 'Thêm mới',
          icon: <Plus className="h-4 w-4" />,
          onClick: onAdd || (() => {})
        }}
      />

      <div className="flex-1 p-6">
        <DataTable
          data={currentData}
          config={{
            columns,
            rowActions,
          }}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
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

