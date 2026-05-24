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

import { usePositions } from '../hooks/usePositions';
import { PositionUpsertRequest } from '../services/position.api';

const ChucVuPage = () => {
  const {
    positions,
    stats,
    isLoading,
    searchQuery,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    setPageSize,
    setCurrentPage,
    handleSearch,
    fetchPositions,
    fetchStats,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = usePositions();

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

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local search when searchQuery resets externally (e.g. inside hook)
  React.useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced search logic (waiting 500ms of inactivity before firing API)
  React.useEffect(() => {
    if (localSearch === searchQuery) return;

    const handler = setTimeout(() => {
      const trimmed = localSearch.trim();
      setLocalSearch(trimmed);
      handleSearch(trimmed);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch, searchQuery]);

  React.useEffect(() => {
    fetchPositions(searchQuery);
  }, [fetchPositions, searchQuery]); // fetchPositions and searchQuery change trigger query reload

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handlers
  const handleRefresh = () => {
    fetchPositions(searchQuery);
    fetchStats();
    toast.success('Dữ liệu đã được cập nhật');
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

  const handleDeleteClick = (position: Position) => {
    setDeleteModal({ isOpen: true, position });
  };

  const handleClosePositionFormModal = () => {
    setPositionFormModal({ isOpen: false, mode: 'create' });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false });
  };

  const handleSubmitPositionForm = async (positionData: any) => {
    const payload: PositionUpsertRequest = {
      positionName: positionData.name,
      positionCode: positionData.code,
      rankOrder: Number(positionData.ordinal),
      isLeadership: positionData.leader === 'yes',
      description: positionData.description || '',
    };

    let success = false;
    if (positionFormModal.mode === 'create') {
      success = await handleCreate(payload);
    } else if (positionFormModal.mode === 'edit' && positionFormModal.position) {
      success = await handleUpdate(positionFormModal.position.id, payload);
    }

    if (success) {
      handleClosePositionFormModal();
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.position) {
      const success = await handleDelete(deleteModal.position.id);
      if (success) {
        handleCloseDeleteModal();
      }
    }
  };

  // Table Configuration
  const tableConfig = {
    columns: getPositionTableColumns(),
    rowActions: getPositionRowActions(handleView, handleEdit, handleDeleteClick)
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
          totalPositions={stats.totalPositions}
          totalUsers={stats.totalUsers}
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
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const trimmed = localSearch.trim();
                      setLocalSearch(trimmed);
                      handleSearch(trimmed);
                    }
                  }}
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
              data={positions}
              config={tableConfig}
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
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