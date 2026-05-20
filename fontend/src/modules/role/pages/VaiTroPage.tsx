import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { RoleFormModal } from '@/modules/role/components/RoleFormModal';
import { DeleteRoleModal } from '@/modules/role/components/DeleteRoleModal';
import { toast } from '@/lib/toast';
import { Shield, ShieldCheck, Key, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { StatCard } from '@/common/components/ui/StatCard';
import { roleApi } from '../services/role.api';
import { permissionApi } from '../services/permission.api';

// Table Engine
import { DataTable, DataToolbar, BulkActionDef } from '@/common/components/table-engine';
import { Role, getRoleTableColumns, getRoleRowActions, getRoleFilters } from '@/modules/role/table/roleTableColumns';

const VaiTroPage = () => {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // UUID representation

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

  // Dynamic roles state & tables mapping
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [permissionMap, setPermissionMap] = useState<Record<string, string>>({});

  const fetchRoles = async () => {
    try {
      const res = await roleApi.getRoles();
      if (res.success && res.data) {
        setAllRoles(res.data);
      }
    } catch (e: any) {
      toast.error('Lỗi', 'Không thể tải danh sách vai trò');
    }
  };

  const fetchPermissionsForTable = async () => {
    try {
      const res = await permissionApi.getPermissions();
      if (res.success && res.data) {
        const map: Record<string, string> = {};
        res.data.forEach(p => {
          map[p.permCode] = p.description;
        });
        setPermissionMap(map);
      }
    } catch (e) {
      // safe fallback
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissionsForTable();
  }, []);

  // Compute Filtered Data
  const filteredRoles = useMemo(() => {
    return allRoles.filter(role => {
      // 1. Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          role.roleName.toLowerCase().includes(query) ||
          role.roleCode.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [allRoles, searchQuery]);

  // Compute Pagination
  const totalItems = filteredRoles.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentRoles = filteredRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Compute Stats
  const activeRoles = filteredRoles.length; // Fake or standard length representation
  const systemRoles = filteredRoles.filter(r => r.roleCode.startsWith('ROLE_SUPER') || r.roleCode.includes('ADMIN')).length;

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
  const activeFiltersCount = (searchQuery ? 1 : 0);

  const activeFilterTags = useMemo(() => {
    const tags: Array<{ label: string; onRemove: () => void }> = [];
    if (searchQuery) {
      tags.push({ label: `Tìm kiếm: "${searchQuery}"`, onRemove: () => setSearchQuery('') });
    }
    return tags;
  }, [searchQuery]);

  // Handlers for Selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === currentRoles.length && currentRoles.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentRoles.map(r => r.id));
    }
  };

  const handleToggleSelectRow = (id: number | string) => {
    setSelectedIds(prev => prev.includes(id as string) ? prev.filter(x => x !== id) : [...prev, id as string]);
  };

  // Handlers for Actions
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRoles();
    setIsRefreshing(false);
    toast.success('Làm mới thành công', 'Dữ liệu đã được cập nhật');
  };

  // Table Engine Configs
  const columns = useMemo(() => getRoleTableColumns(permissionMap), [permissionMap]);

  // Load backend details before view/edit modals open
  const handleOpenRoleModal = async (mode: 'view' | 'edit', roleId: string) => {
    try {
      const res = await roleApi.getRoleById(roleId);
      if (res.success && res.data) {
        setRoleFormModal({ isOpen: true, mode, role: res.data });
      } else {
        toast.error('Lỗi', res.message || 'Không thể tải chi tiết vai trò');
      }
    } catch (e: any) {
      toast.error('Lỗi', e.message || 'Không thể tải chi tiết vai trò');
    }
  };

  const rowActions = useMemo(() => getRoleRowActions(
    (role) => handleOpenRoleModal('view', role.id),
    (role) => handleOpenRoleModal('edit', role.id),
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
  const handleSubmitRoleForm = async (roleData: any) => {
    try {
      if (roleFormModal.mode === 'create') {
        const res = await roleApi.createRole(roleData);
        if (res.success) {
          toast.success('Thêm vai trò thành công', `Đã thêm vai trò "${roleData.roleName}" vào hệ thống`);
        }
      } else if (roleFormModal.mode === 'edit' && roleFormModal.role) {
        const res = await roleApi.updateRole(roleFormModal.role.id, roleData);
        if (res.success) {
          toast.success('Cập nhật vai trò thành công', `Thông tin vai trò "${roleData.roleName}" đã được cập nhật`);
        }
      }
      fetchRoles();
      setRoleFormModal({ isOpen: false, mode: 'create' });
    } catch (error: any) {
      toast.error('Lỗi lưu trữ', error.message || 'Không thể thực thi lệnh');
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.role) {
      try {
        const res = await roleApi.deleteRole(deleteModal.role.id);
        if (res.success) {
          toast.success('Xóa vai trò thành công', `Đã xóa vai trò "${deleteModal.role.roleName}" khỏi hệ thống`);
        }
        fetchRoles();
      } catch (error: any) {
        toast.error('Lỗi xóa vai trò', error.message || 'Họ tên hoặc vai trò đang được dùng');
      }
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