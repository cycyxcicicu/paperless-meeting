import React, { useState } from 'react';
import { QUAN_TRI_SIDEBAR_ITEMS } from '../constants/sidebar';
import { Sidebar, SidebarItem } from '../components/layout/Sidebar';
import { Pagination } from '../components/common/ui/Pagination';
import { Button } from '../components/common/ui/Button';
import { CustomDropdown } from '../components/common/ui/CustomDropdown';
import { PageHeader } from '../components/layout/PageHeader';
import { UserFormModal } from '../components/user/UserFormModal';
import { DeleteUserModal } from '../components/user/DeleteUserModal';
import { toast } from '../../lib/toast';
import {
  Users,
  Shield,
  Building2,
  Briefcase,
  History,
  Settings,
  Eye,
  MoreVertical,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Upload,
  Home,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  X,
  ChevronDown,
  Check
} from 'lucide-react';



interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: 'active' | 'inactive';
}

const NguoiDungPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');

  // Modal state
  const [userFormModal, setUserFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    user?: User;
  }>({ isOpen: false, mode: 'create' });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user?: User;
  }>({ isOpen: false });

  // Sample unit data
  const units = [
    { id: 'all', name: 'Tất cả' },
    { id: '1', name: 'Văn phòng UBND thành phố Hải Phòng' },
    { id: '2', name: 'Sở Tài chính' },
    { id: '3', name: 'Sở Kế hoạch và Đầu tư' },
    { id: '4', name: 'Sở Xây dựng' },
    { id: '5', name: 'Sở Giao thông vận tải' },
    { id: '6', name: 'Sở Nông nghiệp và Phát triển nông thôn' },
    { id: '7', name: 'Sở Công Thương' },
    { id: '8', name: 'Sở Giáo dục và Đào tạo' },
    { id: '9', name: 'Sở Y tế' },
    { id: '10', name: 'Sở Văn hóa và Thể thao' },
    { id: '11', name: 'Sở Khoa học và Công nghệ' },
    { id: '12', name: 'Sở Tư pháp' },
    { id: '13', name: 'Sở Nội vụ' },
    { id: '14', name: 'Sở Lao động - Thương binh và Xã hội' },
  ];



  // Mock data
  const allUsers: User[] = Array.from({ length: 32 }, (_, i) => ({
    id: i + 1,
    username: `user${String(i + 1).padStart(3, '0')}`,
    fullName: `Nguyễn Văn ${String.fromCharCode(65 + (i % 26))}`,
    email: `user${i + 1}@example.com`,
    phone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    position: i % 3 === 0 ? 'Trưởng phòng' : i % 3 === 1 ? 'Phó phòng' : 'Chuyên viên',
    department: 'Văn phòng UBND thành phố Hải Phòng',
    status: 'active' as const,
  }));

  // Filter users based on search and filters
  const filteredUsers = allUsers.filter(user => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        user.username.toLowerCase().includes(query) ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query);

      if (!matchesSearch) return false;
    }

    // Role filter (mock - in real app would check user role)
    if (filterRole !== 'all') {
      // For demo purposes, we'll just keep all users
      // In real app: if (user.role !== filterRole) return false;
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (user.status !== filterStatus) return false;
    }

    // Unit filter (mock - in real app would check user department)
    if (filterUnit !== 'all') {
      // For demo purposes, we'll just keep all users
      // In real app: if (user.departmentId !== filterUnit) return false;
    }

    return true;
  });

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Get current page users
  const users = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole, filterStatus, filterUnit]);

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const toggleSelectUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
  const inactiveUsers = filteredUsers.filter(u => u.status === 'inactive').length;

  // Filter functions
  const resetFilters = () => {
    setFilterRole('all');
    setFilterStatus('all');
    setFilterUnit('all');
    setSearchQuery('');
    setUnitSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filterRole !== 'all') count++;
    if (filterStatus !== 'all') count++;
    if (filterUnit !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const getActiveFilterTags = () => {
    const tags: Array<{ label: string; onRemove: () => void }> = [];
    if (searchQuery) {
      tags.push({
        label: `Tìm kiếm: "${searchQuery}"`,
        onRemove: () => setSearchQuery('')
      });
    }
    if (filterRole !== 'all') {
      tags.push({
        label: `Vai trò: ${filterRole === 'admin' ? 'Admin' : filterRole === 'staff' ? 'Nhân viên' : 'Người dùng'}`,
        onRemove: () => setFilterRole('all')
      });
    }
    if (filterStatus !== 'all') {
      tags.push({
        label: `Trạng thái: ${filterStatus === 'active' ? 'Hoạt động' : filterStatus === 'inactive' ? 'Ngừng hoạt động' : filterStatus === 'pending' ? 'Chờ duyệt' : 'Bị khóa'}`,
        onRemove: () => setFilterStatus('all')
      });
    }
    if (filterUnit !== 'all') {
      const selectedUnit = units.find(u => u.id === filterUnit);
      tags.push({
        label: `Đơn vị: ${selectedUnit?.name || filterUnit}`,
        onRemove: () => setFilterUnit('all')
      });
    }
    return tags;
  };



  // Modal handlers
  const handleOpenCreateModal = () => {
    setUserFormModal({ isOpen: true, mode: 'create' });
  };

  const handleOpenViewModal = (user: User) => {
    setUserFormModal({ isOpen: true, mode: 'view', user });
  };

  const handleOpenEditModal = (user: User) => {
    setUserFormModal({ isOpen: true, mode: 'edit', user });
  };

  const handleOpenDeleteModal = (user: User) => {
    setDeleteModal({ isOpen: true, user });
  };

  const handleCloseUserFormModal = () => {
    setUserFormModal({ isOpen: false, mode: 'create' });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false });
  };

  const handleSubmitUserForm = (userData: any) => {
    // Handle create or update user
    console.log('User form submitted:', userData);

    if (userFormModal.mode === 'create') {
      toast.success('Thêm người dùng thành công', `Đã thêm người dùng ${userData.fullName} vào hệ thống`);
      // TODO: Call API to create user
    } else if (userFormModal.mode === 'edit') {
      toast.success('Cập nhật người dùng thành công', `Thông tin người dùng ${userData.fullName} đã được cập nhật`);
      // TODO: Call API to update user
    }
  };

  const handleConfirmDelete = () => {
    // Handle delete user
    console.log('Delete user:', deleteModal.user);
    if (deleteModal.user) {
      toast.success('Xóa người dùng thành công', `Đã xóa người dùng ${deleteModal.user.fullName} khỏi hệ thống`);
    }
    // TODO: Call API to delete user
  };

  return (
    <>
      <div className="bg-gray-50/50">
        <div className="p-8">
          {/* Page Header */}
          <PageHeader
            breadcrumbs={[
              { name: "Trang chủ", path: "/" },
              { name: "Quản lý người dùng" },
            ]}
            actions={
              <Button
                onClick={handleOpenCreateModal}
                variant="primary"
              >
                <Plus className="h-4 w-4" />
                Thêm người dùng mới
              </Button>
            }
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Tổng số người dùng
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 text-xs text-blue-600 font-semibold">(Đã lọc)</span>
                    )}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đang hoạt động</p>
                  <p className="text-3xl font-bold text-emerald-600">{activeUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ngừng hoạt động</p>
                  <p className="text-3xl font-bold text-gray-400">{inactiveUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <UserX className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-200/60">
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên đăng nhập, email, số điện thoại..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-12 pr-4 text-sm bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all relative ${
                    showFilters
                      ? 'bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white shadow-md'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Bộ lọc
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Xuất file
                </Button>

                <Button variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Bulk Actions Bar */}
              {selectedUsers.length > 0 && (
                <div className="mt-4 flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Đã chọn {selectedUsers.length} người dùng
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                      <Mail className="h-3.5 w-3.5" />
                      Gửi email
                    </button>
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filter Panel */}
            {showFilters && (
              <div className="px-6 py-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200/60">
                <div className="space-y-4">
                  {/* Filter Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Role Filter */}
                    <CustomDropdown
                      label="Vai trò"
                      options={[
                        { value: 'all', label: 'Tất cả' },
                        { value: 'admin', label: 'Admin' },
                        { value: 'staff', label: 'Nhân viên' },
                        { value: 'user', label: 'Người dùng' }
                      ]}
                      value={filterRole}
                      onChange={(val) => {
                        setFilterRole(val);
                        setCurrentPage(1);
                      }}
                    />

                    {/* Status Filter */}
                    <CustomDropdown
                      label="Trạng thái"
                      options={[
                        { value: 'all', label: 'Tất cả' },
                        { value: 'active', label: 'Hoạt động' },
                        { value: 'inactive', label: 'Ngừng hoạt động' },
                        { value: 'pending', label: 'Chờ duyệt' },
                        { value: 'locked', label: 'Bị khóa' }
                      ]}
                      value={filterStatus}
                      onChange={(val) => {
                        setFilterStatus(val);
                        setCurrentPage(1);
                      }}
                    />

                    {/* Unit Filter - Searchable Dropdown */}
                    <CustomDropdown
                      label="Đơn vị"
                      searchable={true}
                      searchPlaceholder="Tìm kiếm đơn vị..."
                      options={units.map(u => ({ value: u.id, label: u.name }))}
                      value={filterUnit}
                      onChange={(val) => {
                        setFilterUnit(val);
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  {/* Filter Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Bộ lọc tự động áp dụng khi bạn thay đổi</p>
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      <X className="h-4 w-4" />
                      Đặt lại bộ lọc
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
              <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-200/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-700">Bộ lọc đang áp dụng:</span>
                  {getActiveFilterTags().map((tag, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-sm font-medium text-gray-700 border border-gray-300 rounded-full shadow-sm"
                    >
                      <span>{tag.label}</span>
                      <button
                        onClick={tag.onRemove}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={resetFilters}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 underline ml-2"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                    <th className="w-12 px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">STT</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tên đăng nhập</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Họ và tên</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Số điện thoại</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Chức vụ</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Đơn vị</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`transition-all hover:bg-blue-50/30 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{user.username}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{user.fullName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.position}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.department}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200">
                          Hoạt động
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenViewModal(user)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(user)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
            />
          </div>
        </div>

      {/* Modals */}
      <UserFormModal
        isOpen={userFormModal.isOpen}
        onClose={handleCloseUserFormModal}
        onSubmit={handleSubmitUserForm}
        mode={userFormModal.mode}
        initialData={userFormModal.user}
      />

      <DeleteUserModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        user={deleteModal.user}
      />
    </div>
  </>
  );
};

export default NguoiDungPage;