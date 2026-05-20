import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { UserFormModal } from '@/modules/user/components/UserFormModal';
import { DeleteUserModal } from '@/modules/user/components/DeleteUserModal';
import { toast } from '@/lib/toast';
import { Users, UserCheck, UserX, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { StatCard } from '@/common/components/ui/StatCard';

// Table Engine imports
import { DataTable, DataToolbar, BulkActionDef } from '@/common/components/table-engine';
import { User, getUserTableColumns, getUserRowActions, getUserFilters, getUserFilterLabel } from '@/modules/user/table/userTable.schema';
import { usePaginationQuery } from '@/common/hooks/usePaginationQuery';
import { userApi } from '@/modules/user/services/user.api';

const NguoiDungPage = () => {
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

  // Mock data - Units (Giữ mock đơn vị nếu BE chưa có API danh sách đơn vị)
  const units = useMemo(() => [
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
  ], []);

  // Gọi API thông qua Hook usePaginationQuery (Sử dụng fetchFunction tập trung)
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
    fetchFunction: userApi.getUsers,
    initialPage: 1,
    initialSize: 10,
  });

  // Tính toán Thống kê dựa trên dữ liệu hiện tại / API totalItems
  // LƯU Ý: active/inactive tạm thời đếm trên Data của trang hiện tại vì API pagination thường không kèm stats, 
  // hoặc bạn có thể gọi thêm API stats riêng nếu BE hỗ trợ.
  const activeUsersCount = useMemo(() => allUsers.filter(u => u.status === 'active').length, [allUsers]);
  const inactiveUsersCount = useMemo(() => allUsers.filter(u => u.status === 'inactive').length, [allUsers]);

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
      await refresh();
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

  // Submit Axios Mutation Handlers
  const handleSubmitUserForm = async (userData: any) => {
    try {
      if (userFormModal.mode === 'create') {
        const response = await userApi.createUser(userData);
        if (response.success) {
          toast.success('Thêm người dùng thành công');
        } else {
          throw new Error(response.message || 'Thao tác không thành công');
        }
      } else if (userFormModal.mode === 'edit' && userFormModal.user) {
        const response = await userApi.updateUser(userFormModal.user.id, userData);
        if (response.success) {
          toast.success('Cập nhật người dùng thành công');
        } else {
          throw new Error(response.message || 'Thao tác không thành công');
        }
      }
      refresh();
      setUserFormModal({ isOpen: false, mode: 'create' });
    } catch (error: any) {
      toast.error('Có lỗi xảy ra', error.message || 'Không thể lưu dữ liệu');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteModal.user) {
        // Xóa đơn lẻ
        const response = await userApi.deleteUser(deleteModal.user.id);
        if (response.success) {
          toast.success('Xóa người dùng thành công');
        } else {
          throw new Error(response.message || 'Xóa thất bại');
        }
      } else if (selectedIds.length > 0) {
        // Xóa nhiều người dùng đã chọn
        await Promise.all(selectedIds.map(id => userApi.deleteUser(id)));
        toast.success(`Đã xóa ${selectedIds.length} người dùng thành công`);
      }
      refresh();
      setDeleteModal({ isOpen: false });
      setSelectedIds([]);
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi xóa', error.message || 'Không thể thực thi');
    }
  };

  return (
    <>
      <div className="bg-gray-50/50 relative min-h-screen">
        <div className="p-8">
          {/* Page Header */}
          <PageHeader
            breadcrumbs={[{ name: "Trang chủ", path: "/" }, { name: "Quản lý" }]}
            actions={
              <Button onClick={() => setUserFormModal({ isOpen: true, mode: 'create' })} variant="primary">
                <Plus className="h-4 w-4" /> Thêm người dùng mới
              </Button>
            }
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard 
              title="Tổng số người dùng" 
              value={totalItems} 
              icon={<Users />} 
              color="blue" 
              hasFilters={activeFiltersCount > 0} 
            />
            <StatCard 
              title="Đang hoạt động trên trang" 
              value={activeUsersCount} 
              icon={<UserCheck />} 
              color="emerald" 
            />
            <StatCard 
              title="Ngừng hoạt động trên trang" 
              value={inactiveUsersCount} 
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
              itemLabel="người dùng"
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