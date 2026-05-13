import React, { useState, useMemo } from 'react';
import { QUAN_TRI_SIDEBAR_ITEMS } from '../constants/sidebar';
import { Sidebar, SidebarItem } from '../components/layout/Sidebar';
import { Pagination as AppPagination } from '@/app/components/common/ui/Pagination';
import { PageHeader } from '../components/layout/PageHeader';
import { PositionFormModal } from '../components/positions/PositionFormModal';
import { DeletePositionModal } from '../components/positions/DeletePositionModal';
import {
  Users,
  Shield,
  Building2,
  Briefcase,
  History,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { PositionSummary } from '../components/positions/PositionSummary';
import { PositionToolbar } from '../components/positions/PositionToolbar';
import { PositionTable } from '../components/positions/PositionTable';
import { EmptyState } from '../components/positions/EmptyState';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../../lib/toast';

// Tạm thời định nghĩa cn tại đây để tránh lỗi import nếu có
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



interface Position {
  id: string;
  name: string;
  code: string;
  description: string;
  memberCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const mockPositions: Position[] = [
  { id: '1', name: 'Chủ tịch UBND Thành phố', code: 'CT_UBND', description: 'Người đứng đầu cơ quan hành chính nhà nước cao nhất ở địa phương.', memberCount: 1, status: 'active', createdAt: '2023-01-15' },
  { id: '2', name: 'Phó Chủ tịch Thường trực', code: 'PCT_TT', description: 'Hỗ trợ Chủ tịch điều hành các hoạt động chung của UBND.', memberCount: 1, status: 'active', createdAt: '2023-01-16' },
  { id: '3', name: 'Phó Chủ tịch UBND', code: 'PCT_UBND', description: 'Phụ trách các mảng lĩnh vực cụ thể theo phân công.', memberCount: 3, status: 'active', createdAt: '2023-01-17' },
  { id: '4', name: 'Chánh Văn phòng', code: 'CVP', description: 'Điều hành mọi hoạt động của Văn phòng UBND Thành phố.', memberCount: 1, status: 'active', createdAt: '2023-01-20' },
  { id: '5', name: 'Phó Chánh Văn phòng', code: 'PCVP', description: 'Hỗ trợ Chánh Văn phòng trong công tác quản lý điều hành.', memberCount: 4, status: 'active', createdAt: '2023-01-21' },
  { id: '6', name: 'Trưởng phòng', code: 'TP', description: 'Chịu trách nhiệm quản lý trực tiếp một phòng ban chuyên môn.', memberCount: 12, status: 'active', createdAt: '2023-02-01' },
  { id: '7', name: 'Phó Trưởng phòng', code: 'PTP', description: 'Hỗ trợ Trưởng phòng quản lý điều hành phòng ban.', memberCount: 24, status: 'active', createdAt: '2023-02-05' },
  { id: '8', name: 'Chuyên viên chính', code: 'CVC', description: 'Cán bộ có trình độ chuyên môn nghiệp vụ cao trong lĩnh vực.', memberCount: 45, status: 'active', createdAt: '2023-02-10' },
  { id: '9', name: 'Chuyên viên', code: 'CV', description: 'Thực hiện các công việc chuyên môn theo sự phân công.', memberCount: 120, status: 'active', createdAt: '2023-02-15' },
  { id: '10', name: 'Kế toán trưởng', code: 'KTT', description: 'Phụ trách công tác tài chính kế toán của đơn vị.', memberCount: 2, status: 'active', createdAt: '2023-02-20' },
  { id: '11', name: 'Thủ quỹ', code: 'TQ', description: 'Quản lý quỹ tiền mặt của cơ quan đơn vị.', memberCount: 2, status: 'inactive', createdAt: '2023-02-25' },
  { id: '12', name: 'Văn thư', code: 'VT', description: 'Tiếp nhận, lưu trữ và luân chuyển công văn tài liệu.', memberCount: 5, status: 'active', createdAt: '2023-03-01' },
];

const ChucVuPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modal state
  const [positionFormModal, setPositionFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    position?: Position;
  }>({ isOpen: false, mode: 'create' });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    position?: Position;
  }>({ isOpen: false });

  // Filter positions
  const filteredPositions = useMemo(() => {
    return mockPositions.filter(pos => 
      pos.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredPositions.length / pageSize);
  const currentData = filteredPositions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Handlers
  const handleToggleSelectAll = () => {
    if (selectedPositions.length === currentData.length) {
      setSelectedPositions([]);
    } else {
      setSelectedPositions(currentData.map(p => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedPositions.includes(id)) {
      setSelectedPositions(prev => prev.filter(i => i !== id));
    } else {
      setSelectedPositions(prev => [...prev, id]);
    }
  };

  const handleRefresh = () => {
    toast.success('Dữ liệu đã được cập nhật');
    setSearchQuery('');
  };

  const handleAddNew = () => {
    setPositionFormModal({ isOpen: true, mode: 'create' });
  };

  const handleExport = () => {
    toast.info('Đang chuẩn bị dữ liệu xuất file...');
  };

  const handleView = (id: string) => {
    const position = mockPositions.find(p => p.id === id);
    if (position) {
      setPositionFormModal({ isOpen: true, mode: 'view', position });
    }
  };

  const handleEdit = (id: string) => {
    const position = mockPositions.find(p => p.id === id);
    if (position) {
      setPositionFormModal({ isOpen: true, mode: 'edit', position });
    }
  };

  const handleDelete = (id: string) => {
    const position = mockPositions.find(p => p.id === id);
    if (position) {
      setDeleteModal({ isOpen: true, position });
    }
  };

  const handleResetSearch = () => {
    setSearchQuery('');
  };

  const handleClosePositionFormModal = () => {
    setPositionFormModal({ isOpen: false, mode: 'create' });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false });
  };

  const handleSubmitPositionForm = (positionData: any) => {
    console.log('Position form submitted:', positionData);

    if (positionFormModal.mode === 'create') {
      toast.success('Thêm chức vụ thành công', `Đã thêm chức vụ "${positionData.name}" vào hệ thống`);
      // TODO: Call API to create position
    } else if (positionFormModal.mode === 'edit') {
      toast.success('Cập nhật chức vụ thành công', `Thông tin chức vụ "${positionData.name}" đã được cập nhật`);
      // TODO: Call API to update position
    }
  };

  const handleConfirmDelete = () => {
    console.log('Delete position:', deleteModal.position);
    if (deleteModal.position) {
      toast.success('Xóa chức vụ thành công', `Đã xóa chức vụ "${deleteModal.position.name}" khỏi hệ thống`);
    }
    // TODO: Call API to delete position
  };

  return (
    <>

        {/* Page Header */}
        <div className="p-8">
          <PageHeader
            breadcrumbs={[
              { name: "Trang chủ", path: "/" },
              { name: "Quản lý người dùng", path: "/nguoi-dung" },
              { name: "Danh mục chức vụ" },
            ]}

          />

          {/* Summary Strip */}
          <PositionSummary 
            totalPositions={mockPositions.length}
            totalUsers={mockPositions.reduce((acc, curr) => acc + curr.memberCount, 0)}
            activePositions={mockPositions.filter(p => p.status === 'active').length}
            inactivePositions={mockPositions.filter(p => p.status === 'inactive').length}
          />

          {/* Main Content Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/50 overflow-hidden"
          >
            {/* Toolbar */}
            <PositionToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onRefresh={handleRefresh}
              onAddNew={handleAddNew}
              onExport={handleExport}
            />

            {/* Content Area */}
            <AnimatePresence mode="wait">
              {filteredPositions.length > 0 ? (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <PositionTable 
                    positions={currentData}
                    selectedPositions={selectedPositions}
                    onToggleSelectAll={handleToggleSelectAll}
                    onToggleSelect={handleToggleSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    currentPage={currentPage}
                    pageSize={pageSize}
                  />

                  {/* Pagination */}
                  <AppPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={filteredPositions.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    itemLabel="chức vụ"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <EmptyState 
                    type={searchQuery ? 'search' : 'no-data'} 
                    onReset={handleResetSearch}
                    onAdd={handleAddNew}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

      {/* Modals */}
      <PositionFormModal
        isOpen={positionFormModal.isOpen}
        onClose={handleClosePositionFormModal}
        onSubmit={handleSubmitPositionForm}
        mode={positionFormModal.mode}
        initialData={positionFormModal.position}
      />

      <DeletePositionModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        position={deleteModal.position}
      />
    </>
  );
};

export default ChucVuPage;