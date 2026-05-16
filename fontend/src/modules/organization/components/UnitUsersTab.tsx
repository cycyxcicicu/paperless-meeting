import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Shield,
  UserCheck,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Pagination } from '@/common/components/ui/app-pagination';

interface UnitUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  position: string;
  isActive: boolean;
}

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
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Reset to first page when users change
  useEffect(() => {
    setCurrentPage(1);
  }, [users]);

  // Reset to first page when search or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Filter users by name, email, or phone
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
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Toolbar */}
      <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="relative flex-1 group mr-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-[#C8102E] transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng theo tên, email, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
          />
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white heading text-sm hover:shadow-lg transition-all shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Thêm mới
        </button>
      </div>

      {/* User Table */}
      <div className="px-8 py-6 flex-1 overflow-hidden">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          {filteredUsers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
                <Users className="h-10 w-10" />
              </div>
              {searchQuery ? (
                <>
                  <h4 className="text-xl heading text-gray-900 mb-2">Không tìm thấy kết quả</h4>
                  <p className="text-gray-500 max-w-xs text-center body">
                    Không tìm thấy nhân sự nào phù hợp với từ khóa "{searchQuery}"
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-xl heading text-gray-900 mb-2">Không tìm thấy nhân sự</h4>
                  <p className="text-gray-500 max-w-xs text-center body">
                    Đơn vị này hiện chưa có nhân sự nào được gán quyền truy cập.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Table with Scrollable Body */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10">
                    <tr>
                      <th className="px-6 py-4 text-xs body text-gray-500 uppercase tracking-wide border-b border-gray-100">Họ và tên / Tài khoản</th>
                      <th className="px-6 py-4 text-xs body text-gray-500 uppercase tracking-wide border-b border-gray-100">Chức vụ / Vai trò</th>
                      <th className="px-6 py-4 text-xs body text-gray-500 uppercase tracking-wide border-b border-gray-100">Liên hệ</th>
                      <th className="px-6 py-4 text-xs body text-gray-500 uppercase tracking-wide border-b border-gray-100">Trạng thái</th>
                      <th className="px-6 py-4 text-xs body text-gray-500 uppercase tracking-wide border-b border-gray-100 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentData.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 text-sm btn-primary border-2 border-white shadow-sm ring-1 ring-gray-100">
                              {user.fullName.split(' ').pop()?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm btn-primary text-gray-900 group-hover:text-[#C8102E] transition-colors">{user.fullName}</div>
                              <div className="text-xs body text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="text-sm body text-gray-700 flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                              {user.position}
                            </div>
                            <div className="inline-flex items-center gap-1.5 text-xs btn-primary text-[#C8102E] bg-[#C8102E]/5 px-2 py-0.5 rounded-md w-fit">
                              <Shield className="h-3 w-3" />
                              {user.role}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="text-sm body text-gray-600 flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              {user.email}
                            </div>
                            <div className="text-sm body text-gray-600 flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              {user.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs heading ring-1",
                            user.isActive
                              ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
                              : "bg-red-50 text-red-600 ring-red-100"
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? "bg-emerald-500" : "bg-red-500")} />
                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="px-6 py-5 relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === user.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-6 top-12 z-20 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-2">
                                <button
                                  onClick={() => {
                                    onView?.(user.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm body text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                  Xem
                                </button>
                                <button
                                  onClick={() => {
                                    onEdit?.(user.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm body text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                >
                                  <Edit className="h-4 w-4 text-amber-600" />
                                  Sửa
                                </button>
                                <button
                                  onClick={() => {
                                    onDelete?.(user.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm body text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Xóa
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Common Pagination - same as NguoiDungPage */}
              <div className="border-t border-gray-100 shrink-0">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  itemLabel="nhân sự"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
