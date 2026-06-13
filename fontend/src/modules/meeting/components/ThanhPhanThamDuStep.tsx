import React, { useState } from 'react';
import { Plus, Trash2, Users as UsersIcon, Edit2 } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { SelectUnitModal, Member } from './SelectUnitModal';
import { AddGuestModal, GuestData } from './AddGuestModal';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { TableEngineConfig } from '@/common/components/table-engine/table.types';
import { cn } from '@/common/utils/cn';
import { toast } from '@/lib/toast';

interface ThanhPhanThamDuData {
  donVi: Member[];
  caNhan: Member[];
  nhomThanhVien: any[];
  khachMoi: any[];
  chuTriId: string | null;
}

interface ThanhPhanThamDuStepProps {
  data: ThanhPhanThamDuData;
  onChange?: (data: ThanhPhanThamDuData) => void;
  readOnly?: boolean;
}

type TabType = 'donvi' | 'khachmoi';

const ThanhPhanThamDuStep: React.FC<ThanhPhanThamDuStepProps> = ({ data, onChange, readOnly = false }) => {
  const [activeTab, setActiveTab] = useState<TabType>('donvi');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const tabs = [
    { id: 'donvi' as TabType, label: 'Đơn vị', count: data.donVi?.length || 0 },
    { id: 'khachmoi' as TabType, label: 'Khách mời', count: data.khachMoi?.length || 0 },
  ];

  const handleConfirmUnitSelection = (selectedMembers: Member[]) => {
    const chairMap = new Map((data.donVi || []).map(m => [m.id, m.isChair]));
    const secretaryMap = new Map((data.donVi || []).map(m => [m.id, m.isSecretary]));
    const updatedMembers = selectedMembers.map(m => ({
      ...m,
      isChair: chairMap.get(m.id) || false,
      isSecretary: secretaryMap.get(m.id) || false
    }));

    if (onChange) {
      onChange({
        ...data,
        donVi: updatedMembers,
      });
    }
  };

  const handleConfirmGuest = (guest: GuestData) => {
    let updatedKhachMoi = [...(data.khachMoi || [])];
    if (editingGuest) {
      updatedKhachMoi = updatedKhachMoi.map((m: any) => m.id === guest.id ? guest : m);
    } else {
      updatedKhachMoi.push(guest);
    }
    
    if (onChange) {
      onChange({
        ...data,
        khachMoi: updatedKhachMoi,
      });
    }
    setEditingGuest(null);
  };

  const handleRemoveFromDonVi = (memberId: string) => {
    if (onChange) {
      onChange({
        ...data,
        donVi: data.donVi.filter((m: Member) => m.id !== memberId),
      });
    }
  };

  const handleRemoveGuest = (guestId: string) => {
    if (onChange) {
      onChange({
        ...data,
        khachMoi: data.khachMoi.filter((m: any) => m.id !== guestId),
      });
    }
  };

  const handleToggleChair = (memberId: string, checked: boolean) => {
    if (checked) {
      const currentChairs = (data.donVi || []).filter(m => m.isChair).length;
      if (currentChairs >= 3) {
        toast.error('Tối đa 3 người chủ trì', 'Bạn chỉ được chọn tối đa 3 người chủ trì cho phiên họp.');
        return;
      }
    }

    const updatedDonVi = (data.donVi || []).map(m => {
      if (m.id === memberId) {
        return { ...m, isChair: checked, isSecretary: checked ? false : m.isSecretary };
      }
      return m;
    });

    if (onChange) {
      onChange({
        ...data,
        donVi: updatedDonVi,
      });
    }
  };

  const handleToggleSecretary = (memberId: string, checked: boolean) => {
    const updatedDonVi = (data.donVi || []).map(m => {
      if (m.id === memberId) {
        return { ...m, isSecretary: checked, isChair: checked ? false : m.isChair };
      }
      return m;
    });

    if (onChange) {
      onChange({
        ...data,
        donVi: updatedDonVi,
      });
    }
  };

  const donViTableConfig: TableEngineConfig<Member> = {
    columns: [
      { key: 'name', header: 'Họ và tên' },
      { key: 'position', header: 'Chức vụ' },
      { key: 'unit', header: 'Đơn vị' },
      { key: 'email', header: 'Email' },
      {
        key: 'isChair',
        header: 'Chủ trì',
        width: '120px',
        align: 'center',
        render: (row) => {
          if (readOnly) {
            return row.isChair ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-[#C8102E]">
                Chủ trì
              </span>
            ) : (
              <span className="text-gray-400 text-xs">-</span>
            );
          }

          const currentChairs = (data.donVi || []).filter(m => m.isChair).length;
          const isMaxReached = currentChairs >= 3;
          const isChecked = !!row.isChair;
          const isDisabled = isMaxReached && !isChecked;

          return (
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={(e) => handleToggleChair(row.id, e.target.checked)}
                className={`w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] transition-all ${
                  isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                }`}
              />
            </div>
          );
        }
      },
      {
        key: 'isSecretary',
        header: 'Thư ký',
        width: '120px',
        align: 'center',
        render: (row) => {
          if (readOnly) {
            return row.isSecretary ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Thư ký
              </span>
            ) : (
              <span className="text-gray-400 text-xs">-</span>
            );
          }

          const isChecked = !!row.isSecretary;

          return (
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleToggleSecretary(row.id, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] transition-all cursor-pointer hover:scale-105"
              />
            </div>
          );
        }
      }
    ],
    rowActions: readOnly ? [] : [
      {
        key: 'delete',
        label: 'Xóa',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'danger',
        onClick: (row) => handleRemoveFromDonVi(row.id),
      },
    ],
  };

  const guestTableConfig: TableEngineConfig<any> = {
    columns: [
      { key: 'name', header: 'Họ và tên' },
      { key: 'position', header: 'Chức vụ' },
      { key: 'unit', header: 'Đơn vị' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Số điện thoại', render: (row) => row.phone || '-' },
    ],
    rowActions: readOnly ? [] : [
      {
        key: 'edit',
        label: 'Sửa',
        icon: <Edit2 className="h-4 w-4" />,
        variant: 'primary',
        onClick: (row) => {
          setEditingGuest(row);
          setShowGuestModal(true);
        },
      },
      {
        key: 'delete',
        label: 'Xóa',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'danger',
        onClick: (row) => handleRemoveGuest(row.id),
      },
    ],
  };

  const EmptyState: React.FC<{ message: string; onAdd?: () => void }> = ({ message, onAdd }) => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <UsersIcon className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      {onAdd && (
        <Button variant="secondary" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Thêm mới
        </Button>
      )}
    </div>
  );

  return (
    <div>
      <div className="border border-gray-400 rounded-xl overflow-hidden">
        {/* Tabs - 50/50 Layout with sliding effect */}
        <div className="bg-gray-100 p-1 border-b border-gray-300">
          <div className="relative flex w-full">
            {/* Background slider */}
            <div 
              className="absolute top-0 bottom-0 w-1/2 bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out"
              style={{ transform: activeTab === 'donvi' ? 'translateX(0%)' : 'translateX(100%)' }}
            />
            
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1); // Reset page on tab change
                }}
                className={cn(
                  'relative w-1/2 py-2.5 text-sm btn-primary transition-colors z-10',
                  activeTab === tab.id ? 'text-[#C8102E]' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <div className="flex items-center justify-center">
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        'ml-2 px-2 py-0.5 rounded-full text-xs heading transition-colors',
                        activeTab === tab.id ? 'bg-red-50 text-[#C8102E]' : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[400px] bg-white">
          {/* Tab: Đơn vị */}
          {activeTab === 'donvi' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm btn-primary text-gray-700">Danh sách nhân viên từ Đơn vị</h3>
                {!readOnly && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowUnitModal(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Thêm từ đơn vị
                  </Button>
                )}
              </div>
              
              {!data.donVi || data.donVi.length === 0 ? (
                <EmptyState
                  message="Chưa có nhân viên nào được thêm từ đơn vị"
                  onAdd={() => setShowUnitModal(true)}
                />
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <DataTable
                    data={data.donVi.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                    config={donViTableConfig}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={data.donVi.length}
                    totalPages={Math.ceil(data.donVi.length / pageSize)}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={() => {}} // Assuming fixed size for simplicity or pass handler
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab: Khách mời */}
          {activeTab === 'khachmoi' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm btn-primary text-gray-700">Danh sách khách mời</h3>
                {!readOnly && (
                  <Button variant="secondary" size="sm" onClick={() => { setEditingGuest(null); setShowGuestModal(true); }}>
                    <Plus className="h-4 w-4" />
                    Thêm khách mời
                  </Button>
                )}
              </div>
              
              {!data.khachMoi || data.khachMoi.length === 0 ? (
                <EmptyState 
                  message="Chưa có khách mời nào được thêm" 
                  onAdd={() => { setEditingGuest(null); setShowGuestModal(true); }}
                />
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <DataTable
                    data={data.khachMoi.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                    config={guestTableConfig}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={data.khachMoi.length}
                    totalPages={Math.ceil(data.khachMoi.length / pageSize)}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={() => {}}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SelectUnitModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onConfirm={handleConfirmUnitSelection}
        mode="unit"
        title="Chọn từ đơn vị"
        initialSelectedMembers={data.donVi}
      />

      <AddGuestModal
        isOpen={showGuestModal}
        onClose={() => { setShowGuestModal(false); setEditingGuest(null); }}
        onConfirm={handleConfirmGuest}
        initialData={editingGuest}
      />
    </div>
  );
};

export { ThanhPhanThamDuStep };
export type { ThanhPhanThamDuData };
