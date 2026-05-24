import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { getErrorMessage } from '@/lib/api/error';
import { UserFormModal } from '@/modules/user/components/UserFormModal';
import { DeleteUserModal } from '@/modules/user/components/DeleteUserModal';
import { toast } from '@/lib/toast';
import { Users, UserCheck, UserX, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { StatCard } from '@/common/components/ui/StatCard';
import { useAuth } from '@/app/context/AuthContext';

// Table Engine imports
import { DataTable, DataToolbar, BulkActionDef } from '@/common/components/table-engine';
import { User, getUserTableColumns, getUserRowActions, getUserFilters, getUserFilterLabel } from '@/modules/user/table/userTable.schema';
import { usePaginationQuery } from '@/common/hooks/usePaginationQuery';
import { userApi, UserStatsResponse } from '@/modules/user/services/user.api';
import { departmentApi, DepartmentTreeResponse } from '@/modules/organization/services/department.api';

// Helper: flatten tree thành array {id, name}
const flattenTree = (nodes: DepartmentTreeResponse[]): { id: string; name: string }[] => {
  const result: { id: string; name: string }[] = [];
  const walk = (list: DepartmentTreeResponse[]) => {
    for (const node of list) {
      result.push({ id: node.id, name: node.deptName });
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return result;
};

const NguoiDungPage = () => {
  const { user: authUser } = useAuth();
  const roleCode = authUser?.role?.roleCode || 'USER';
  const isSuperAdmin = roleCode === 'SUPER_ADMIN';
  const isDeptAdmin = roleCode === 'DEPARTMENT_ADMIN';

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal State
  const [userFormModal, setUserFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    user?: User;
  }>({ isOpen: false, mode: 'create' });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user?: User;
    count?: number;
  }>({ isOpen: false });

  const [showFilters, setShowFilters] = useState(false);

  // Stats from API
  const [stats, setStats] = useState<UserStatsResponse>({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0 });

  // Department options loaded from API tree
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);

  // Load stats from API
  const fetchStats = useCallback(async () => {
    try {
      const res = await userApi.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.error('Error fetching user stats:', e);
    }
  }, []);

  // Load department tree from API, scoped per role:
  // SUPER_ADMIN: chỉ lấy level-1 (những node gốc = không có parentDepartmentId)
  // DEPT_ADMIN: lấy các đơn vị con trong cây của mình (trừ root)
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentApi.getTree();
      if (res.success && res.data) {
        if (isSuperAdmin) {
          // Chỉ lấy level-1 (root nodes — các Sở/Cơ quan)
          const level1 = res.data.map((node: DepartmentTreeResponse) => ({ id: node.id, name: node.deptName }));
          setUnits(level1);
        } else {
          // DEPT_ADMIN: lấy tất cả đơn vị con (phòng, bộ phận) trong cây của mình
          // res.data sẽ là [rootNode] → lấy children của rootNode
          const rootNode = res.data[0];
          if (rootNode) {
            const children = flattenTree(rootNode.children || []);
            setUnits(children);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching departments:', e);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchStats();
    fetchDepartments();
  }, [fetchStats, fetchDepartments]);

  // Backend tự xử lý phân quyền, frontend chỉ cần rename search -> keyword
  const fetchUsersFunction = useCallback((params: any) => {
    const adjustedParams = { ...params };
    if (adjustedParams.search) {
      adjustedParams.keyword = adjustedParams.search;
      delete adjustedParams.search;
    }
    // Xóa các filter 'all' để tránh gửi giá trị rác lên backend
    Object.keys(adjustedParams).forEach(k => {
      if (adjustedParams[k] === 'all') delete adjustedParams[k];
    });

    // Ép buộc lọc danh sách các Quản trị viên (DEPARTMENT_ADMIN) trên trang Quản trị Người Dùng
    // đối với tài khoản cấp tối cao (để không bị lẫn lộn chuyên viên khi filter theo phòng ban)
    if (isSuperAdmin) {
      adjustedParams.roleCode = 'DEPARTMENT_ADMIN';
    }

    return userApi.getUsers(adjustedParams);
  }, [isSuperAdmin]);

  // Gọi API thông qua Hook usePaginationQuery 
  const {
    data: allUsers,
    totalItems,
    totalPages,
    loading,
    page: currentPage,
    size: pageSize,
    search: searchQuery,
    filters: filterValues,
    handlePageChange: setCurrentPage,
    handleSizeChange: setPageSize,
    handleSearch: setSearchQuery,
    handleFilterChange: setFilterValues,
    refresh,
  } = usePaginationQuery<User>({
    fetchFunction: fetchUsersFunction,
    initialPage: 1,
    initialSize: 10,
  });

  // Handlers for Filters
  const handleFilterChange = (key: string, val: string) => {
    setFilterValues({
      ...filterValues,
      [key]: val,
    });
  };

  const handleResetFilters = () => {
    setFilterValues({});
    setSearchQuery('');
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
          label: getUserFilterLabel(key, value, units),
          onRemove: () => handleFilterChange(key, 'all')
        });
      }
    });
    return tags;
  }, [searchQuery, filterValues, units]);

  // Handlers for Selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === allUsers.length && allUsers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allUsers.map(u => u.id));
    }
  };

  const handleToggleSelectRow = (id: number | string) => {
    setSelectedIds(prev => prev.includes(id as number) ? prev.filter(x => x !== id) : [...prev, id as number]);
  };

  // Refresh Handler
  const handleRefresh = async () => {
    try {
      await Promise.all([refresh(), fetchStats()]);
      toast.success('Làm mới thành công', 'Dữ liệu đã được cập nhật');
    } catch {
      toast.error('Làm mới thất bại');
    }
  };

  // Table Engine Configs
  const columns = useMemo(() => getUserTableColumns(), []);
  
  const handleOpenUserModal = async (mode: 'view' | 'edit', userId: number) => {
    try {
      const response = await userApi.getUserById(userId);
      if (response.success && response.data) {
        setUserFormModal({ isOpen: true, mode, user: response.data as any });
      } else {
        toast.error('Lỗi', response.message || 'Không thể lấy thông tin chi tiết');
      }
    } catch (error: any) {
      toast.error('Lỗi', error.message || 'Không thể lấy thông tin chi tiết từ máy chủ');
    }
  };

  const rowActions = useMemo(() => getUserRowActions(
    (user) => handleOpenUserModal('view', user.id),
    (user) => handleOpenUserModal('edit', user.id),
    (user) => setDeleteModal({ isOpen: true, user })
  ), []);

  const tableFilters = useMemo(() => getUserFilters(units), [units]);

  const bulkActions: BulkActionDef[] = useMemo(() => [
    {
      key: 'delete',
      label: 'Xóa',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      variant: 'danger',
      onClick: (ids) => setDeleteModal({ isOpen: true, count: ids.length })
    }
  ], []);

  const tableConfig = {
    columns,
    rowActions,
  };

  // Dynamic labels depending on role
  const pageTitle = isSuperAdmin ? 'Admin đơn vị' : 'Nhân sự';
  const cardTotalLabel = isSuperAdmin ? 'Tổng admin đơn vị' : 'Tổng nhân sự';
  const cardActiveLabel = isSuperAdmin ? 'Đang hoạt động' : 'Đang hoạt động';
  const cardInactiveLabel = isSuperAdmin ? 'Ngừng hoạt động' : 'Ngừng hoạt động';
  const addButtonLabel = isSuperAdmin ? 'Thêm admin đơn vị' : 'Thêm nhân sự';


  // Submit Axios Mutation Handlers
  const handleSubmitUserForm = async (userData: any) => {
    try {
      if (userFormModal.mode === 'create') {
        const response = await userApi.createUser(userData);
        if (response.success) {
          toast.success('Thêm thành công');
        } else {
          throw new Error(response.message || 'Thao tác không thành công');
        }
      } else if (userFormModal.mode === 'edit' && userFormModal.user) {
        const response = await userApi.updateUser(userFormModal.user.id, userData);
        if (response.success) {
          toast.success('Cập nhật thành công');
        } else {
          throw new Error(response.message || 'Thao tác không thành công');
        }
      }
      refresh();
      fetchStats();
      setUserFormModal({ isOpen: false, mode: 'create' });
    } catch (error: any) {
      toast.error('Có lỗi xảy ra', getErrorMessage(error, 'Không thể lưu dữ liệu'));
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteModal.user) {
        // Xóa đơn lẻ
        const response = await userApi.deleteUser(deleteModal.user.id);
        if (response.success) {
          toast.success('Xóa thành công');
        } else {
          throw new Error(response.message || 'Xóa thất bại');
        }
      } else if (selectedIds.length > 0) {
        // Xóa nhiều
        await Promise.all(selectedIds.map(id => userApi.deleteUser(id)));
        toast.success(`Đã xóa ${selectedIds.length} người dùng thành công`);
      }
      refresh();
      fetchStats();
      setDeleteModal({ isOpen: false });
      setSelectedIds([]);
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi xóa', getErrorMessage(error, 'Không thể thực thi'));
    }
  };

  return (
    <>
      <div className="bg-gray-50/50 relative min-h-screen">
        <div className="p-8">
          {/* Page Header */}
          <PageHeader
            breadcrumbs={[{ name: "Trang chủ", path: "/" }, { name: "Quản lý" }, { name: pageTitle }]}
            actions={
              <Button onClick={() => setUserFormModal({ isOpen: true, mode: 'create' })} variant="primary">
                <Plus className="h-4 w-4" /> {addButtonLabel}
              </Button>
            }
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard 
              title={cardTotalLabel} 
              value={stats.totalUsers} 
              icon={<Users />} 
              color="blue" 
              hasFilters={activeFiltersCount > 0} 
            />
            <StatCard 
              title={cardActiveLabel} 
              value={stats.activeUsers} 
              icon={<UserCheck />} 
              color="emerald" 
            />
            <StatCard 
              title={cardInactiveLabel} 
              value={stats.inactiveUsers} 
              icon={<UserX />} 
              color="gray" 
            />
          </div>

          {/* Main Content Card with Table Engine */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-2xl">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            )}

            <DataToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={tableFilters}
              filterValues={filterValues}
              onFilterChange={handleFilterChange}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              onResetFilters={handleResetFilters}
              activeFiltersCount={activeFiltersCount}
              activeFilterTags={activeFilterTags}
              onRefresh={handleRefresh}
              isRefreshing={loading}
              selectedIds={selectedIds}
              totalItems={allUsers.length}
              onSelectAll={handleToggleSelectAll}
              bulkActions={bulkActions}
            />

            <DataTable
              data={allUsers}
              config={tableConfig}
              selectedIds={selectedIds}
              onToggleSelectAll={handleToggleSelectAll}
              onToggleSelectRow={handleToggleSelectRow}
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel={isSuperAdmin ? 'admin đơn vị' : 'nhân sự'}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={userFormModal.isOpen}
        onClose={() => setUserFormModal({ isOpen: false, mode: 'create' })}
        onSubmit={handleSubmitUserForm}
        mode={userFormModal.mode}
        initialData={userFormModal.user}
        lockRole={isDeptAdmin}
      />

      <DeleteUserModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        user={deleteModal.user}
        count={deleteModal.count}
      />
    </>
  );
};

export default NguoiDungPage;