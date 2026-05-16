import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { PositionFormModal } from '@/modules/positions/components/PositionFormModal';
import { DeletePositionModal } from '@/modules/positions/components/DeletePositionModal';
import {
  Search,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { PositionSummary } from '@/modules/positions/components/PositionSummary';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '@/lib/toast';

// Import Table Engine
import { DataTable } from '@/common/components/table-engine/DataTable';
import { 
  getPositionTableColumns, 
  getPositionRowActions,
  Position 
} from '../table/positionTable.schema';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const currentData = filteredPositions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Handlers
  const handleRefresh = () => {
    toast.success('Dữ liệu đã được cập nhật');
    setSearchQuery('');
  };

  const handleAddNew = () => {
    setPositionFormModal({ isOpen: true, mode: 'create' });
  };

  const handleView = (position: Position) => {
    setPositionFormModal({ isOpen: true, mode: 'view', position });
  };

  const handleEdit = (position: Position) => {
    setPositionFormModal({ isOpen: true, mode: 'edit', position });
  };

  const handleDelete = (position: Position) => {
    setDeleteModal({ isOpen: true, position });
  };

  const handleClosePositionFormModal = () => {
    setPositionFormModal({ isOpen: false, mode: 'create' });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false });
  };

  const handleSubmitPositionForm = (positionData: any) => {
    if (positionFormModal.mode === 'create') {
      toast.success('Thêm chức vụ thành công');
    } else if (positionFormModal.mode === 'edit') {
      toast.success('Cập nhật chức vụ thành công');
    }
    handleClosePositionFormModal();
  };

  const handleConfirmDelete = () => {
    if (deleteModal.position) {
      toast.success('Xóa chức vụ thành công');
    }
    handleCloseDeleteModal();
  };

  // Table Configuration
  const tableConfig = {
    columns: getPositionTableColumns(),
    rowActions: getPositionRowActions(handleView, handleEdit, handleDelete)
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="p-8">
        <PageHeader
          breadcrumbs={[
            { name: "Trang chủ", path: "/" },
            { name: "Quản lý", path: "/nguoi-dung" },
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
          <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C8102E] transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc mã chức vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C8102E]/50 focus:ring-4 focus:ring-[#C8102E]/5 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleRefresh}
                  className="w-11 h-11 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                  title="Làm mới"
                >
                  <RefreshCw className="h-4.5 w-4.5" />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button 
                  onClick={handleAddNew}
                  className="inline-flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white text-sm heading rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 group"
                >
                  <Plus className="h-5 w-5" />
                  <span>Thêm chức vụ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-0">
            <DataTable
              data={currentData}
              config={tableConfig}
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredPositions.length}
              totalPages={Math.ceil(filteredPositions.length / pageSize)}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemLabel="chức vụ"
              getRowId={(row) => row.id}
            />
          </div>
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
    </div>
  );
};

export default ChucVuPage;