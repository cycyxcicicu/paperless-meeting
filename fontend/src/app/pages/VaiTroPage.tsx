import React, { useState, useEffect } from 'react';
import { QUAN_TRI_SIDEBAR_ITEMS } from '../constants/sidebar';
import { Sidebar, SidebarItem } from '../components/layout/Sidebar';
import { PageHeader } from '../components/layout/PageHeader';
import { Pagination as AppPagination } from '@/app/components/common/ui/Pagination';
import { CustomDropdown } from '@/app/components/common/ui/CustomDropdown';
import { RoleFormModal } from '../components/role/RoleFormModal';
import { DeleteRoleModal } from '../components/role/DeleteRoleModal';
import { toast } from '../../lib/toast';
import {
  Users,
  Shield,
  Building2,
  Briefcase,
  History,
  Settings,
  Eye,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Home,
  Search,
  Edit,
  Trash2,
  X,
  ChevronDown,
  Check,
  ShieldCheck,
  ShieldAlert,
  Key
} from 'lucide-react';



interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  userCount?: number;
}

const VaiTroPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal state
  const [roleFormModal, setRoleFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    role?: Role;
  }>({ isOpen: false, mode: 'create' });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    role?: Role;
  }>({ isOpen: false });

  // Mock data
  const allRoles: Role[] = [
    {
      id: 1,
      name: 'TWD_Tổng hợp Phiếu lấy ý kiến',
      code: 'TWD_TH_PLYK',
      description: 'Vai trò dành cho người có quyền tổng hợp PLYK tại đơn vị',
      isActive: true,
      isSystem: false,
      userCount: 12
    },
    {
      id: 2,
      name: 'TWD_Chủ trì',
      code: 'TWD_CHUTRI',
      description: '',
      isActive: true,
      isSystem: false,
      userCount: 8
    },
    {
      id: 3,
      name: 'TWD_Quản trị hệ thống',
      code: 'ROLE_SUPER_ADMIN_DV',
      description: 'ROLE cho quản trị hệ thống',
      isActive: true,
      isSystem: true,
      userCount: 3
    },
    {
      id: 4,
      name: 'TWD_Khách mời',
      code: 'TWD_KM',
      description: 'ROLE cho khách mời tham gia phiên họp',
      isActive: true,
      isSystem: false,
      userCount: 25
    },
    {
      id: 5,
      name: 'TWD_Thư ký',
      code: 'TWD_THUKY',
      description: 'ROLE cho thư ký và chuyên viên tạo phiên',
      isActive: true,
      isSystem: false,
      userCount: 5
    },
    {
      id: 6,
      name: 'TWD_Thành viên',
      code: 'TWD_TV',
      description: 'ROLE cho thành viên - chủ trì',
      isActive: true,
      isSystem: false,
      userCount: 45
    },
    {
      id: 7,
      name: 'Admin Full Menu',
      code: 'ADMIN_FULL_MENU',
      description: '',
      isActive: true,
      isSystem: true,
      userCount: 2
    },
    {
      id: 8,
      name: 'TWD_Thư ký lãnh đạo',
      code: 'ROLE_TK_LANH_DAO',
      description: 'ROLE cho thư ký lãnh đạo',
      isActive: true,
      isSystem: false,
      userCount: 4
    },
    {
      id: 9,
      name: 'TWD_Quản trị đơn vị',
      code: 'ROLE_ADMIN_DV',
      description: 'ROLE cho Admin đơn vị',
      isActive: true,
      isSystem: false,
      userCount: 7
    },
    {
      id: 10,
      name: 'Trợ lý/Thư ký',
      code: 'ROLE_BUSINESS_TK',
      description: '',
      isActive: true,
      isSystem: false,
      userCount: 15
    },
  ];

  // Filter roles
  const filteredRoles = allRoles.filter(role => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        role.name.toLowerCase().includes(query) ||
        role.code.toLowerCase().includes(query) ||
        role.description.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && !role.isActive) return false;
      if (filterStatus === 'inactive' && role.isActive) return false;
    }

    return true;
  });

  const totalItems = filteredRoles.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Get current page roles
  const roles = filteredRoles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSelectAll = () => {
    if (selectedRoles.length === roles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(roles.map(r => r.id));
    }
  };

  const toggleSelectRole = (roleId: number) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const toggleRoleStatus = (roleId: number) => {
    // In real app, this would call an API
    console.log('Toggle role status:', roleId);
  };

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const activeRoles = filteredRoles.filter(r => r.isActive).length;
  const systemRoles = filteredRoles.filter(r => r.isSystem).length;

  const resetFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filterStatus !== 'all') count++;
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
    if (filterStatus !== 'all') {
      tags.push({
        label: `Trạng thái: ${filterStatus === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}`,
        onRemove: () => setFilterStatus('all')
      });
    }
    return tags;
  };

  // Modal handlers
  const handleOpenCreateModal = () => {
    setRoleFormModal({ isOpen: true, mode: 'create' });
  };

  const handleOpenViewModal = (role: Role) => {
    setRoleFormModal({ isOpen: true, mode: 'view', role });
  };

  const handleOpenEditModal = (role: Role) => {
    setRoleFormModal({ isOpen: true, mode: 'edit', role });
  };

  const handleOpenDeleteModal = (role: Role) => {
    setDeleteModal({ isOpen: true, role });
  };

  const handleCloseRoleFormModal = () => {
    setRoleFormModal({ isOpen: false, mode: 'create' });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false });
  };

  const handleSubmitRoleForm = (roleData: any) => {
    // Handle create or update role
    console.log('Role form submitted:', roleData);

    if (roleFormModal.mode === 'create') {
      toast.success('Thêm vai trò thành công', `Đã thêm vai trò "${roleData.name}" vào hệ thống`);
      // TODO: Call API to create role
    } else if (roleFormModal.mode === 'edit') {
      toast.success('Cập nhật vai trò thành công', `Thông tin vai trò "${roleData.name}" đã được cập nhật`);
      // TODO: Call API to update role
    }
  };

  const handleConfirmDelete = () => {
    // Handle delete role
    console.log('Delete role:', deleteModal.role);
    if (deleteModal.role) {
      toast.success('Xóa vai trò thành công', `Đã xóa vai trò "${deleteModal.role.name}" khỏi hệ thống`);
    }
    // TODO: Call API to delete role
  };

  return (
    <>
      <div className="bg-gray-50/50">

        <div className="p-8">
          {/* Page Header */}
          <PageHeader
            breadcrumbs={[
              { name: "Trang chủ", path: "/" },
              { name: "Quản lý người dùng", path: "/nguoi-dung" },
              { name: "Vai trò và phân quyền" },
            ]}
            actions={
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Thêm vai trò mới
              </button>
            }
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Tổng số vai trò
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 text-xs text-blue-600 font-semibold">(Đã lọc)</span>
                    )}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đang hoạt động</p>
                  <p className="text-3xl font-bold text-emerald-600">{activeRoles}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vai trò hệ thống</p>
                  <p className="text-3xl font-bold text-purple-600">{systemRoles}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                  <Key className="h-6 w-6 text-purple-600" />
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
                    placeholder="Tìm kiếm theo tên vai trò, mã vai trò..."
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

                <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all">
                  <Download className="h-4 w-4" />
                  Xuất file
                </button>

                <button className="w-11 h-11 flex items-center justify-center text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* Bulk Actions Bar */}
              {selectedRoles.length > 0 && (
                <div className="mt-4 flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRoles.length === roles.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Đã chọn {selectedRoles.length} vai trò
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                      <Edit className="h-3.5 w-3.5" />
                      Chỉnh sửa hàng loạt
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
                  <div className="grid grid-cols-1 gap-4">
                    {/* Status Filter */}
                    <CustomDropdown
                      label="Trạng thái"
                      options={[
                        { value: 'all', label: 'Tất cả' },
                        { value: 'active', label: 'Hoạt động' },
                        { value: 'inactive', label: 'Ngừng hoạt động' }
                      ]}
                      value={filterStatus}
                      onChange={(val) => {
                        setFilterStatus(val);
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
                        checked={selectedRoles.length === roles.length && roles.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">STT</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tên vai trò</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Mã vai trò</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Mô tả</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roles.map((role, index) => (
                    <tr
                      key={role.id}
                      className={`transition-all hover:bg-blue-50/30 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={() => toggleSelectRole(role.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{role.name}</span>
                          {role.isSystem && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200">
                              <Key className="h-3 w-3" />
                              Hệ thống
                            </span>
                          )}
                        </div>
                        {role.userCount !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">{role.userCount} người dùng</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">{role.code}</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                        {role.description || <span className="text-gray-400">-</span>}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenViewModal(role)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(role)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(role)}
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
            <AppPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemLabel="vai trò"
            />
          </div>
        </div>
      </div>
      {/* Modals */}
      <RoleFormModal
        isOpen={roleFormModal.isOpen}
        onClose={handleCloseRoleFormModal}
        onSubmit={handleSubmitRoleForm}
        mode={roleFormModal.mode}
        initialData={roleFormModal.role}
      />

      <DeleteRoleModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        role={deleteModal.role}
      />
    </>
  );
};

export default VaiTroPage;