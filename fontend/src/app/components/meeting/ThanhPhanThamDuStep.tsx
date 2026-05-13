import React, { useState } from 'react';
import { Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/app/components/common/ui/Button';
import { SelectUnitModal, Member } from './SelectUnitModal';
import { cn } from '../../../lib/utils';

interface ThanhPhanThamDuData {
  donVi: Member[];
  caNhan: Member[];
  nhomThanhVien: any[];
  khachMoi: any[];
  chuTriId: string | null;
}

interface ThanhPhanThamDuStepProps {
  data: ThanhPhanThamDuData;
  onChange: (data: ThanhPhanThamDuData) => void;
}

type TabType = 'donvi' | 'canhan' | 'nhom' | 'khachmoi';

const ThanhPhanThamDuStep: React.FC<ThanhPhanThamDuStepProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>('donvi');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'unit' | 'individual'>('unit');

  const tabs = [
    { id: 'donvi' as TabType, label: 'Đơn vị', count: data.donVi.length },
    { id: 'canhan' as TabType, label: 'Cá nhân', count: data.caNhan.length },
    { id: 'nhom' as TabType, label: 'Nhóm thành viên', count: data.nhomThanhVien.length },
    { id: 'khachmoi' as TabType, label: 'Khách mời', count: data.khachMoi.length },
  ];

  const handleAddFromUnitTree = (mode: 'unit' | 'individual') => {
    setModalMode(mode);
    setShowModal(true);
  };

  const handleConfirmSelection = (selectedMembers: Member[]) => {
    if (modalMode === 'individual') {
      // Add to Cá nhân tab - avoid duplicates
      const existingIds = new Set(data.caNhan.map(m => m.id));
      const newMembers = selectedMembers.filter(m => !existingIds.has(m.id));

      onChange({
        ...data,
        caNhan: [...data.caNhan, ...newMembers],
      });
    } else if (modalMode === 'unit') {
      // Add to Đơn vị tab - avoid duplicates
      const existingIds = new Set(data.donVi.map((m: Member) => m.id));
      const newMembers = selectedMembers.filter(m => !existingIds.has(m.id));

      onChange({
        ...data,
        donVi: [...data.donVi, ...newMembers],
      });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    onChange({
      ...data,
      caNhan: data.caNhan.filter((m) => m.id !== memberId),
      chuTriId: data.chuTriId === memberId ? null : data.chuTriId,
    });
  };

  const handleSetChuTri = (memberId: string) => {
    onChange({
      ...data,
      chuTriId: memberId,
    });
  };

  const handleRemoveFromDonVi = (memberId: string) => {
    onChange({
      ...data,
      donVi: data.donVi.filter((m: Member) => m.id !== memberId),
    });
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
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50/50">
          <div className="flex gap-1 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative px-6 py-3 text-sm font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'text-[#C8102E]'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={cn(
                      'ml-2 px-2 py-0.5 rounded-full text-xs font-bold',
                      activeTab === tab.id
                        ? 'bg-red-100 text-[#C8102E]'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C8102E] to-[#A90F14]" />
                )}
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
                <h3 className="text-sm font-semibold text-gray-700">Danh sách đơn vị</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddFromUnitTree('unit')}
                >
                  <Plus className="h-4 w-4" />
                  Thêm từ cây đơn vị
                </Button>
              </div>
              {data.donVi.length === 0 ? (
                <EmptyState
                  message="Chưa có đơn vị nào được thêm"
                  onAdd={() => handleAddFromUnitTree('unit')}
                />
              ) : (
                <div className="border border-gray-400 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Họ và tên
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Chức vụ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Đơn vị
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Email
                        </th>
                        <th className="w-20 px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.donVi.map((member: Member, index: number) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {member.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.position}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.unit}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRemoveFromDonVi(member.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Cá nhân */}
          {activeTab === 'canhan' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Danh sách cá nhân</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddFromUnitTree('individual')}
                >
                  <Plus className="h-4 w-4" />
                  Thêm từ cây đơn vị
                </Button>
              </div>
              {data.caNhan.length === 0 ? (
                <EmptyState
                  message="Chưa có cá nhân nào được thêm"
                  onAdd={() => handleAddFromUnitTree('individual')}
                />
              ) : (
                <div className="border border-gray-400 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Họ và tên
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Chức vụ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Đơn vị
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                          Chủ trì
                        </th>
                        <th className="w-20 px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.caNhan.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {member.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.position}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.unit}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="radio"
                              name="chuTri"
                              checked={data.chuTriId === member.id}
                              onChange={() => handleSetChuTri(member.id)}
                              className="w-4 h-4 text-[#C8102E] border-gray-300 focus:ring-[#C8102E]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Nhóm thành viên */}
          {activeTab === 'nhom' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Danh sách nhóm</h3>
                <Button variant="secondary" size="sm">
                  <Plus className="h-4 w-4" />
                  Thêm nhóm
                </Button>
              </div>
              <EmptyState message="Chưa có nhóm thành viên nào" />
            </div>
          )}

          {/* Tab: Khách mời */}
          {activeTab === 'khachmoi' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Danh sách khách mời</h3>
                <Button variant="secondary" size="sm">
                  <Plus className="h-4 w-4" />
                  Thêm khách mời
                </Button>
              </div>
              <EmptyState message="Chưa có khách mời nào" />
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <SelectUnitModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSelection}
        mode={modalMode}
        title={modalMode === 'unit' ? 'Chọn đơn vị' : 'Chọn cá nhân'}
      />
    </div>
  );
};

export { ThanhPhanThamDuStep };
export type { ThanhPhanThamDuData };
