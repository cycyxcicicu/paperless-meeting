import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { RoleFormModal } from '@/modules/role/components/RoleFormModal';
import { DeleteRoleModal } from '@/modules/role/components/DeleteRoleModal';
import { toast } from '@/lib/toast';
import { Shield, ShieldCheck, Key, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { StatCard } from '@/common/components/ui/StatCard';

// Table Engine
import { DataTable, DataToolbar, BulkActionDef } from '@/common/components/table-engine';
import { Role, getRoleTableColumns, getRoleRowActions, getRoleFilters, getRoleFilterLabel } from '@/modules/role/table/roleTable.schema';

const VaiTroPage = () => {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal State
  const [roleFormModal, setRoleFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    role?: Role;
  }>({ isOpen: false, mode: 'create' });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    role?: Role;
  }>({ isOpen: false });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data
  const allRoles: Role[] = useMemo(() => [
    {
      id: 1,
      name: 'TWD_Tổng hợp Phiếu lấy ý kiến',
      code: 'TWD_TH_PLYK',
      description: 'Vai trò dành cho người có quyền tổng hợp PLYK tại đơn vị',
      isActive: true,
      isSystem: false,
      userCount: 12,
      permissions: ['view_dashboard', 'view_documents', 'upload_documents']
    },
    {
      id: 2,
      name: 'TWD_Chủ trì',
      code: 'TWD_CHUTRI',
      description: '',
      isActive: true,
      isSystem: false,
      userCount: 8,
      permissions: ['view_dashboard', 'create_meeting', 'edit_meeting']
    },
    {
      id: 3,
      name: 'TWD_Quản trị hệ thống',
      code: 'ROLE_SUPER_ADMIN_DV',
      description: 'ROLE cho quản trị hệ thống',
      isActive: true,
      isSystem: true,
      userCount: 3,
      permissions: ['view_dashboard', 'manage_users', 'manage_roles', 'manage_settings']
    },
    {
      id: 4,
      name: 'TWD_Khách mời',
      code: 'TWD_KM',
      description: 'ROLE cho khách mời tham gia phiên họp',
      isActive: true,
      isSystem: false,
      userCount: 25,
      permissions: ['view_documents']
    },
    {
      id: 5,
      name: 'TWD_Thư ký',
      code: 'TWD_THUKY',
      description: 'ROLE cho thư ký và chuyên viên tạo phiên',
      isActive: true,
      isSystem: false,
      userCount: 5,
      permissions: ['view_dashboard', 'create_meeting', 'edit_meeting', 'view_documents', 'upload_documents']
    },
    {
      id: 6,
      name: 'TWD_Thành viên',
      code: 'TWD_TV',
      description: 'ROLE cho thành viên - chủ trì',
      isActive: true,
      isSystem: false,
      userCount: 45,
      permissions: ['view_dashboard', 'view_documents']
    },
    {
      id: 7,
      name: 'Admin Full Menu',
      code: 'ADMIN_FULL_MENU',
      description: '',
      isActive: true,
      isSystem: true,
      userCount: 2,
      permissions: ['view_dashboard', 'manage_users', 'manage_roles', 'create_meeting', 'edit_meeting', 'delete_meeting', 'view_documents', 'upload_documents', 'manage_settings']
    },
    {
      id: 8,
      name: 'TWD_Thư ký lãnh đạo',
      code: 'ROLE_TK_LANH_DAO',
      description: 'ROLE cho thư ký lãnh đạo',
      isActive: true,
      isSystem: false,
      userCount: 4,
      permissions: ['view_dashboard', 'view_documents']
    },
    {
      id: 9,
      name: 'TWD_Quản trị đơn vị',
      code: 'ROLE_ADMIN_DV',
      description: 'ROLE cho Admin đơn vị',
      isActive: true,
      isSystem: false,
      userCount: 7,
      permissions: ['view_dashboard', 'manage_users', 'manage_roles']
    },
    {
      id: 10,
      name: 'Trợ lý/Thư ký',
      code: 'ROLE_BUSINESS_TK',
      description: '',
      isActive: true,
      isSystem: false,
      userCount: 15,
      permissions: ['view_dashboard', 'view_documents']
    },
  ], []);

  // Compute Filtered Data
  const filteredRoles = useMemo(() => {
    return allRoles.filter(role => {
      // 1. Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          role.name.toLowerCase().includes(query) ||
          role.code.toLowerCase().includes(query) ||
          role.description.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // 2. Status filter
      if (filterValues.status && filterValues.status !== 'all') {
        if (filterValues.status === 'active' && !role.isActive) return false;
        if (filterValues.status === 'inactive' && role.isActive) return false;
      }

      return true;
    });
  }, [allRoles, searchQuery, filterValues]);

  // Compute Pagination
  const totalItems = filteredRoles.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentRoles = filteredRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Compute Stats
  const activeRoles = filteredRoles.filter(r => r.isActive).length;
  const systemRoles = filteredRoles.filter(r => r.isSystem).length;

  // Handlers for Filters
  const handleFilterChange = (key: string, val: string) => {
    setFilterValues(prev => ({ ...prev, [key]: val }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilterValues({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Compute Active Filter Tags
  const activeFiltersCount = (searchQuery ? 1 : 0) + Object.values(filterValues).filter(v => v !== 'all').length;

  const activeFilterTags = useMemo(() => {
    const tags: Array<{ label: string; onRemove: () => void }> = [];
    if (searchQuery) {
      tags.push({ label: `Tìm kiếm: "${searchQuery}"`, onRemove: () => setSearchQuery('') });
    }
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value !== 'all') {
        tags.push({
          label: getRoleFilterLabel(key, value),
          onRemove: () => handleFilterChange(key, 'all')
        });
      }
    });
    return tags;
  }, [searchQuery, filterValues]);

  // Handlers for Selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === currentRoles.length && currentRoles.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentRoles.map(r => r.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Handlers for Actions
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Làm mới thành công', 'Dữ liệu đã được cập nhật');
    }, 1000);
  };

  // Table Engine Configs
  const columns = useMemo(() => getRoleTableColumns(), []);

  const rowActions = useMemo(() => getRoleRowActions(
    (role) => setRoleFormModal({ isOpen: true, mode: 'view', role }),
    (role) => setRoleFormModal({ isOpen: true, mode: 'edit', role }),
    (role) => setDeleteModal({ isOpen: true, role })
  ), []);

  const tableFilters = useMemo(() => getRoleFilters(), []);

  const bulkActions: BulkActionDef[] = useMemo(() => [
    {
      key: 'edit-bulk',
      label: 'Chỉnh sửa hàng loạt',
      icon: <Edit className="h-3.5 w-3.5" />,
      onClick: () => toast.info('Chỉnh sửa hàng loạt', `Đã chọn ${selectedIds.length} vai trò`)
    },
    {
      key: 'delete',
      label: 'Xóa',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      variant: 'danger',
      onClick: () => toast.info('Xóa hàng loạt', `Đã chọn ${selectedIds.length} vai trò`)
    }
  ], [selectedIds.length]);

  const tableConfig = {
    columns,
    rowActions,
  };

  // Submit Handlers
  const handleSubmitRoleForm = (roleData: any) => {
    if (roleFormModal.mode === 'create') {
      toast.success('Thêm vai trò thành công', `Đã thêm vai trò "${roleData.name}" vào hệ thống`);
    } else {
      toast.success('Cập nhật vai trò thành công', `Thông tin vai trò "${roleData.name}" đã được cập nhật`);
    }
    setRoleFormModal({ isOpen: false, mode: 'create' });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.role) {
      toast.success('Xóa vai trò thành công', `Đã xóa vai trò "${deleteModal.role.name}" khỏi hệ thống`);
    }
    setDeleteModal({ isOpen: false });
    setSelectedIds([]);
  };

  return (
    <>
      <div className="bg-gray-50/50">
        <div className="p-8">
          {/* Page Header */}
          <PageHeader
            breadcrumbs={[
              { name: "Trang chủ", path: "/" },
              { name: "Quản lý", path: "/nguoi-dung" },
              { name: "Vai trò và phân quyền" },
            ]}
            actions={
              <Button onClick={() => setRoleFormModal({ isOpen: true, mode: 'create' })} variant="primary">
                <Plus className="h-4 w-4" /> Thêm vai trò mới
              </Button>
            }
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Tổng số vai trò"
              value={totalItems}
              icon={<Shield />}
              color="blue"
              hasFilters={activeFiltersCount > 0}
            />
            <StatCard
              title="Đang hoạt động"
              value={activeRoles}
              icon={<ShieldCheck />}
              color="emerald"
            />
            <StatCard
              title="Vai trò hệ thống"
              value={systemRoles}
              icon={<Key />}
              color="purple"
            />
          </div>

          {/* Main Content Card with Table Engine */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
            <DataToolbar
              searchQuery={searchQuery}
              onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
              searchPlaceholder="Tìm kiếm theo tên vai trò, mã vai trò..."
              filters={tableFilters}
              filterValues={filterValues}
              onFilterChange={handleFilterChange}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              onResetFilters={handleResetFilters}
              activeFiltersCount={activeFiltersCount}
              activeFilterTags={activeFilterTags}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              selectedIds={selectedIds}
              totalItems={currentRoles.length}
              onSelectAll={handleToggleSelectAll}
              bulkActions={bulkActions}
            />

            <DataTable
              data={currentRoles}
              config={tableConfig}
              selectedIds={selectedIds}
              onToggleSelectAll={handleToggleSelectAll}
              onToggleSelectRow={handleToggleSelectRow}
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <RoleFormModal
        isOpen={roleFormModal.isOpen}
        onClose={() => setRoleFormModal({ isOpen: false, mode: 'create' })}
        onSubmit={handleSubmitRoleForm}
        mode={roleFormModal.mode}
        initialData={roleFormModal.role}
      />

      <DeleteRoleModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        role={deleteModal.role}
      />
    </>
  );
};

export default VaiTroPage;