import React, { useState } from 'react';
import { Plus, Trash2, Users as UsersIcon, Edit2, Send } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { SelectUnitModal, Member } from './SelectUnitModal';
import { AddGuestModal, GuestData } from './AddGuestModal';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { TableEngineConfig } from '@/common/components/table-engine/table.types';
import { cn } from '@/common/utils/cn';
import { toast } from '@/lib/toast';
import { useAuth } from '@/app/context/AuthContext';
import { meetingApi } from '../services/meeting.api';
import { PositionCode } from '@/common/types/position';

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
  meetingId?: string;
  creatorId?: string | null;
}

type TabType = 'donvi' | 'khachmoi';

const ThanhPhanThamDuStep: React.FC<ThanhPhanThamDuStepProps> = ({
  data,
  onChange,
  readOnly = false,
  meetingId,
  creatorId = null,
}) => {
  const { user } = useAuth();
  const effectiveCreatorId = creatorId || (user ? String(user.id) : null);

  const hasPrivilege = React.useMemo(() => {
    if (!user) return false;
    const role = user.role?.roleCode;
    if (role === 'SUPER_ADMIN' || role === 'DEPARTMENT_ADMIN') return true;
    
    // Check if user is a secretary by position
    const posCode = (user.position as any)?.positionCode || (user as any).positionCode;
    if (posCode === 'THU_KY' || posCode === PositionCode.THU_KY) return true;
    
    // Check if user is the creator of the meeting
    if (effectiveCreatorId && String(user.id) === effectiveCreatorId) return true;
    
    // Check if user is designated as secretary in this meeting
    const isMeetingSecretary = data.donVi?.some(m => m.id === String(user.id) && m.isSecretary);
    if (isMeetingSecretary) return true;

    return false;
  }, [user, effectiveCreatorId, data.donVi]);

  const [activeTab, setActiveTab] = useState<TabType>('donvi');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    if (!readOnly && effectiveCreatorId && user && String(user.id) === effectiveCreatorId) {
      const hasCreator = data.donVi?.some(m => m.id === effectiveCreatorId);
      if (!hasCreator) {
        const creatorMember: Member = {
          id: String(user.id),
          name: user.fullName || user.username,
          position: (user.position as any)?.name || (user as any).positionName || '',
          unit: (user.department as any)?.deptName || (user.department as any)?.name || '',
          unitId: (user.department as any)?.id ? String((user.department as any).id) : '',
          email: user.email || '',
          isChair: false,
          isSecretary: true,
          sendStatus: 'PENDING' as const,
        };
        if (onChange) {
          onChange({
            ...data,
            donVi: [creatorMember, ...(data.donVi || [])],
          });
        }
      }
    }
  }, [effectiveCreatorId, user, data, onChange, readOnly]);

  const tabs = [
    { id: 'donvi' as TabType, label: 'Đơn vị', count: data.donVi?.length || 0 },
    { id: 'khachmoi' as TabType, label: 'Khách mời', count: data.khachMoi?.length || 0 },
  ];

  const renderSendStatus = (status?: 'PENDING' | 'SENT' | 'FAILED') => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Đã gửi
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Gửi lỗi
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Chưa gửi
          </span>
        );
    }
  };

  const handleConfirmUnitSelection = (selectedMembers: Member[]) => {
    const chairMap = new Map((data.donVi || []).map(m => [m.id, m.isChair]));
    const secretaryMap = new Map((data.donVi || []).map(m => [m.id, m.isSecretary]));
    const updatedMembers = selectedMembers.map(m => {
      const isCreator = effectiveCreatorId && m.id === effectiveCreatorId;
      return {
        ...m,
        isChair: isCreator ? false : (chairMap.get(m.id) || false),
        isSecretary: isCreator ? true : (secretaryMap.get(m.id) || false)
      };
    });

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
    if (effectiveCreatorId && memberId === effectiveCreatorId) return; // Người tạo mặc định là Thư ký, không được làm Chủ trì

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
    if (effectiveCreatorId && memberId === effectiveCreatorId) return; // Người tạo mặc định là Thư ký, không thể thay đổi

    if (checked) {
      const currentSecretaries = (data.donVi || []).filter(m => m.isSecretary || (effectiveCreatorId && m.id === effectiveCreatorId)).length;
      if (currentSecretaries >= 2) {
        toast.error('Tối đa 2 thư ký');
        return;
      }
    }

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
      { 
        key: 'name', 
        header: 'Họ và tên',
        render: (row) => (
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            {row.substitutedForUserName && (
              <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5 mt-1 inline-flex items-center gap-1 font-normal">
                Đi thay cho: <span className="font-semibold">{row.substitutedForUserName}</span>
                {row.substitutedForUserPosition ? ` (${row.substitutedForUserPosition})` : ''}
              </div>
            )}
          </div>
        )
      },
      { key: 'position', header: 'Chức vụ' },
      { key: 'unit', header: 'Đơn vị' },
      { key: 'email', header: 'Email' },
      ...(hasPrivilege ? [{
        key: 'sendStatus',
        header: 'Trạng thái gửi thư',
        render: (row: Member) => renderSendStatus(row.sendStatus)
      }] : []),
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
          const isCreator = effectiveCreatorId && row.id === effectiveCreatorId;
          const isDisabled = !!isCreator || (isMaxReached && !isChecked);

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

          const isCreator = effectiveCreatorId && row.id === effectiveCreatorId;
          const isChecked = !!isCreator || !!row.isSecretary;
          const isDisabled = !!isCreator;

          return (
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={(e) => handleToggleSecretary(row.id, e.target.checked)}
                className={`w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] transition-all ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                }`}
              />
            </div>
          );
        }
      }
    ],
    rowActions: hasPrivilege ? [
      {
        key: 'resend-email',
        label: 'Gửi lại email',
        icon: <Send className="h-4 w-4" />,
        variant: 'primary',
        show: (row) => row.sendStatus === 'FAILED',
        onClick: async (row) => {
          if (!meetingId) {
            toast.error('Không tìm thấy thông tin cuộc họp');
            return;
          }
          try {
            await meetingApi.resendEmail(meetingId, row.id, 'INTERNAL');
            toast.success('Gửi lại email thành công');
            if (onChange) {
              const updatedDonVi = (data.donVi || []).map(m =>
                m.id === row.id ? { ...m, sendStatus: 'SENT' as const } : m
              );
              onChange({ ...data, donVi: updatedDonVi });
            }
          } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Gửi lại email thất bại');
          }
        }
      },
      ...(!readOnly ? [
        {
          key: 'delete',
          label: 'Xóa',
          icon: <Trash2 className="h-4 w-4" />,
          variant: 'danger' as const,
          show: (row: Member) => !(effectiveCreatorId && row.id === effectiveCreatorId),
          onClick: (row: Member) => handleRemoveFromDonVi(row.id),
        }
      ] : [])
    ] : [],
  };

  const guestTableConfig: TableEngineConfig<any> = {
    columns: [
      { 
        key: 'name', 
        header: 'Họ và tên',
        render: (row: any) => (
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            {row.substitutedForUserName && (
              <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5 mt-1 inline-flex items-center gap-1 font-normal">
                Đi thay cho: <span className="font-semibold">{row.substitutedForUserName}</span>
                {row.substitutedForUserPosition ? ` (${row.substitutedForUserPosition})` : ''}
              </div>
            )}
          </div>
        )
      },
      { key: 'position', header: 'Chức vụ' },
      { key: 'unit', header: 'Đơn vị' },
      { key: 'email', header: 'Email' },
      ...(hasPrivilege ? [{
        key: 'sendStatus',
        header: 'Trạng thái gửi thư',
        render: (row: any) => renderSendStatus(row.sendStatus)
      }] : []),
      { key: 'phone', header: 'Số điện thoại', render: (row: any) => row.phone || '-' },
    ],
    rowActions: hasPrivilege ? [
      {
        key: 'resend-email',
        label: 'Gửi lại email',
        icon: <Send className="h-4 w-4" />,
        variant: 'primary',
        show: (row: any) => row.sendStatus === 'FAILED',
        onClick: async (row: any) => {
          if (!meetingId) {
            toast.error('Không tìm thấy thông tin cuộc họp');
            return;
          }
          try {
            await meetingApi.resendEmail(meetingId, row.id, 'GUEST');
            toast.success('Gửi lại email thành công');
            if (onChange) {
              const updatedGuests = (data.khachMoi || []).map(m =>
                m.id === row.id ? { ...m, sendStatus: 'SENT' as const } : m
              );
              onChange({ ...data, khachMoi: updatedGuests });
            }
          } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Gửi lại email thất bại');
          }
        }
      },
      ...(!readOnly ? [
        {
          key: 'edit',
          label: 'Sửa',
          icon: <Edit2 className="h-4 w-4" />,
          variant: 'primary' as const,
          onClick: (row: any) => {
            setEditingGuest(row);
            setShowGuestModal(true);
          },
        },
        {
          key: 'delete',
          label: 'Xóa',
          icon: <Trash2 className="h-4 w-4" />,
          variant: 'danger' as const,
          onClick: (row: any) => handleRemoveGuest(row.id),
        }
      ] : [])
    ] : [],
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
                  onAdd={readOnly ? undefined : () => setShowUnitModal(true)}
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
                  onAdd={readOnly ? undefined : () => { setEditingGuest(null); setShowGuestModal(true); }}
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
        creatorId={effectiveCreatorId}
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
