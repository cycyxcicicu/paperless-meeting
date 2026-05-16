import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { UserFormModal } from '@/modules/user/components/UserFormModal';
import { DeleteUserModal } from '@/modules/user/components/DeleteUserModal';
import { EmailUserModal } from '@/modules/user/components/EmailUserModal';
import { toast } from '@/lib/toast';
import { Users, UserCheck, UserX, Plus, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { StatCard } from '@/common/components/ui/StatCard';

// Table Engine imports
import { DataTable, DataToolbar, BulkActionDef } from '@/common/components/table-engine';
import { User, getUserTableColumns, getUserRowActions, getUserFilters, getUserFilterLabel } from '@/modules/user/table/userTable.schema';

const NguoiDungPage = () => {
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

  const [emailModalIsOpen, setEmailModalIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - Units
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

  // Mock data - Users
  const allUsers: User[] = useMemo(() => Array.from({ length: 32 }, (_, i) => ({
    id: i + 1,
    username: `user${String(i + 1).padStart(3, '0')}`,
    fullName: `Nguyễn Văn ${String.fromCharCode(65 + (i % 26))}`,
    email: `user${i + 1}@example.com`,
    phone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    position: i % 3 === 0 ? 'Trưởng phòng' : i % 3 === 1 ? 'Phó phòng' : 'Chuyên viên',
    department: 'Văn phòng UBND thành phố Hải Phòng',
    status: i % 5 === 0 ? 'inactive' : 'active' as const,
  })), []);

  // Compute Filtered Data
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      // 1. Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          user.username.toLowerCase().includes(query) ||
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone.includes(query);
        if (!matches) return false;
      }
      
      // 2. Dropdown filters
      if (filterValues.status && filterValues.status !== 'all') {
        if (user.status !== filterValues.status) return false;
      }
      return true;
    });
  }, [allUsers, searchQuery, filterValues]);

  // Compute Pagination
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Compute Stats
  const activeUsersCount = allUsers.filter(u => u.status === 'active').length;
  const inactiveUsersCount = allUsers.filter(u => u.status === 'inactive').length;

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
          label: getUserFilterLabel(key, value, units),
          onRemove: () => handleFilterChange(key, 'all')
        });
      }
    });
    return tags;
  }, [searchQuery, filterValues, units]);

  // Handlers for Selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === currentUsers.length && currentUsers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentUsers.map(u => u.id));
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
  const columns = useMemo(() => getUserTableColumns(), []);
  
  const rowActions = useMemo(() => getUserRowActions(
    (user) => setUserFormModal({ isOpen: true, mode: 'view', user }),
    (user) => setUserFormModal({ isOpen: true, mode: 'edit', user }),
    (user) => setDeleteModal({ isOpen: true, user })
  ), []);

  const tableFilters = useMemo(() => getUserFilters(units), [units]);

  const bulkActions: BulkActionDef[] = useMemo(() => [
    {
      key: 'email',
      label: 'Gửi email',
      icon: <Mail className="h-3.5 w-3.5" />,
      onClick: () => setEmailModalIsOpen(true)
    },
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

  // Submit Handlers
  const handleSubmitUserForm = (userData: any) => {
    if (userFormModal.mode === 'create') {
      toast.success('Thêm người dùng thành công');
    } else {
      toast.success('Cập nhật người dùng thành công');
    }
    setUserFormModal({ isOpen: false, mode: 'create' });
  };

  const handleConfirmDelete = () => {
    toast.success('Xóa người dùng thành công');
    setDeleteModal({ isOpen: false });
    setSelectedIds([]);
  };

  return (
    <>
      <div className="bg-gray-50/50">
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
              value={allUsers.length} 
              icon={<Users />} 
              color="blue" 
              hasFilters={activeFiltersCount > 0} 
            />
            <StatCard 
              title="Đang hoạt động" 
              value={activeUsersCount} 
              icon={<UserCheck />} 
              color="emerald" 
            />
            <StatCard 
              title="Ngừng hoạt động" 
              value={inactiveUsersCount} 
              icon={<UserX />} 
              color="gray" 
            />
          </div>

          {/* Main Content Card with Table Engine */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
            <DataToolbar
              searchQuery={searchQuery}
              onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
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
              totalItems={currentUsers.length}
              onSelectAll={handleToggleSelectAll}
              bulkActions={bulkActions}
            />

            <DataTable
              data={currentUsers}
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
              itemLabel="người dùng"
            />
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

        <EmailUserModal
          isOpen={emailModalIsOpen}
          onClose={() => setEmailModalIsOpen(false)}
          onSubmit={(data) => toast.success('Gửi email thành công', `Đã gửi email với tiêu đề: ${data.subject}`)}
          count={selectedIds.length}
        />
      </div>
    </>
  );
};

export default NguoiDungPage;