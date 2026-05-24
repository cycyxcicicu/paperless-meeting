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
import { getErrorMessage } from '@/lib/api/error';

// Table Engine
import { DataTable, DataToolbar, BulkActionDef } from '@/common/components/table-engine';
import { Role, getRoleTableColumns, getRoleRowActions } from '@/modules/role/table/roleTableColumns';

const VaiTroPage = () => {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  // Filters currently unused for Roles

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
  const [stats, setStats] = useState({ totalRoles: 0, activeRoles: 0, usersWithoutRole: 0 });

  const fetchRoles = async (keyword?: string) => {
    try {
      const res = await roleApi.getRoles(keyword);
      if (res.success && res.data) {
        setAllRoles(res.data);
      }
    } catch (e: any) {
      toast.error('Lỗi', getErrorMessage(e, 'Không thể tải danh sách vai trò'));
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

  const fetchRoleStats = async () => {
    try {
      const res = await roleApi.getRoleStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (e) {
      // safe fallback
    }
  };

  useEffect(() => {
    fetchPermissionsForTable();
    fetchRoleStats();
  }, []);

  useEffect(() => {
    fetchRoles(searchQuery);
  }, [searchQuery]);

  // Compute Pagination
  const totalItems = allRoles.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentRoles = allRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Compute Stats (fetched from backend)
  const activeRoles = stats.activeRoles;
  const usersWithoutRole = stats.usersWithoutRole;

  // Handlers for Reset
  const handleResetFilters = () => {
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
    await Promise.all([
      fetchRoles(searchQuery),
      fetchRoleStats()
    ]);
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
      toast.error('Lỗi', getErrorMessage(e, 'Không thể tải chi tiết vai trò'));
    }
  };

  const rowActions = useMemo(() => getRoleRowActions(
    (role) => handleOpenRoleModal('view', role.id),
    (role) => handleOpenRoleModal('edit', role.id),
    (role) => setDeleteModal({ isOpen: true, role })
  ), []);

  // Filter configuration (Empty for now)

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
      fetchRoles(searchQuery);
      fetchRoleStats();
      setRoleFormModal({ isOpen: false, mode: 'create' });
    } catch (error: any) {
      toast.error('Lỗi lưu trữ', getErrorMessage(error, 'Không thể thực thi lệnh'));
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.role) {
      try {
        const res = await roleApi.deleteRole(deleteModal.role.id);
        if (res.success) {
          toast.success('Xóa vai trò thành công', `Đã xóa vai trò "${deleteModal.role.roleName}" khỏi hệ thống`);
        }
        fetchRoles(searchQuery);
        fetchRoleStats();
      } catch (error: any) {
        toast.error('Lỗi xóa vai trò', getErrorMessage(error, 'Không thể xóa vai trò'));
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
              value={stats.totalRoles}
              icon={<Shield />}
              color="blue"
              hasFilters={activeFiltersCount > 0}
            />
            <StatCard
              title="Đang được sử dụng"
              value={activeRoles}
              icon={<ShieldCheck />}
              color="emerald"
            />
            <StatCard
              title="Tài khoản chưa có vai trò"
              value={usersWithoutRole}
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
              // Unused filter configurations removed
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