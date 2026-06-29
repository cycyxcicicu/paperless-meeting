import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Eye, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Badge } from '@/common/components/ui/badge';
import { Card, CardContent } from '@/common/components/ui/card';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { DataToolbar } from '@/common/components/table-engine/DataToolbar';
import { TableTooltip } from '@/common/components/table-engine/TableTooltip';
import { TableEngineConfig, ColumnDef } from '@/common/components/table-engine/table.types';
import { cn } from '@/common/utils/cn';
import { AttendanceDetailModal, AttendanceDetailRecord } from './AttendanceDetailModal';
import { meetingApi } from '@/modules/meeting/services/meeting.api';
import { toast } from 'sonner';

type TabType = 'donvi' | 'khachmoi';

interface AttendanceRecord {
  id: string | number;
  unit: string;
  name: string;
  position: string;
  status: 'present' | 'pending' | 'absent';
  reasonAbsent?: string;
  replacementPerson?: {
    name: string;
    position: string;
    unit: string;
  };
  type: 'individual' | 'unit' | 'guest';
  isChair?: boolean;
  isFullSession?: boolean;
  absentAgendaItemIds?: string[];
  isSubstitute?: boolean;
  substitutedForUserName?: string;
  substitutedForIsFullSession?: boolean;
  substitutedForAbsentAgendaItemIds?: string[];
  role?: string;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  guestToken?: string | null;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  meetingId,
  guestToken,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('donvi');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceDetailRecord | null>(null);
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    if (!isOpen || (!meetingId && !guestToken)) return;

    const fetchAttendees = async () => {
      setLoading(true);
      try {
        const [res, agendaRes] = await Promise.all([
          guestToken
            ? meetingApi.publicGetAttendees(guestToken)
            : meetingApi.getAttendees(meetingId),
          guestToken
            ? meetingApi.publicGetAgendaItems(guestToken)
            : meetingApi.getAgendaItems(meetingId)
        ]);

        if (agendaRes.success && agendaRes.data) {
          setAgendaItems(agendaRes.data);
        }

        if (res.success && res.data) {
          const parts = res.data.participants || [];
          const guests = res.data.guests || [];

          const mappedParticipants: AttendanceRecord[] = parts.map((p: any) => {
            let status: 'present' | 'pending' | 'absent' = 'pending';
            if (p.attendanceStatus === 'PRESENT') {
              status = 'present';
            } else if (p.attendanceStatus === 'ABSENT' || p.inviteStatus === 'DECLINED') {
              status = 'absent';
            }

            const replacementPerson = (p.attendanceStatus === 'ABSENT' || p.inviteStatus === 'DECLINED') && (p.substituteName || p.substituteUserFullName) ? {
              name: p.substituteName || p.substituteUserFullName,
              position: p.substitutePosition || '-',
              unit: p.substituteDepartment || p.deptName || '-',
            } : undefined;

            const orig = p.substituteForParticipantId 
              ? parts.find((x: any) => String(x.id) === String(p.substituteForParticipantId))
              : undefined;

            return {
              id: p.userId,
              unit: p.deptName || '-',
              name: p.fullName || p.username,
              position: p.positionName || '-',
              status,
              reasonAbsent: p.declineReason || p.note || undefined,
              replacementPerson,
              type: p.participantRole === 'CHAIR' || p.participantRole === 'CHAIRPERSON' ? 'individual' : 'unit',
              isChair: p.participantRole === 'CHAIR' || p.participantRole === 'CHAIRPERSON',
              role: p.participantRole,
              isFullSession: p.isFullSession,
              absentAgendaItemIds: p.absentAgendaItemIds || [],
              isSubstitute: p.isSubstitute,
              substitutedForUserName: p.substitutedForUserName || orig?.fullName,
              substitutedForIsFullSession: p.substitutedForIsFullSession !== undefined ? p.substitutedForIsFullSession : orig?.isFullSession,
              substitutedForAbsentAgendaItemIds: p.substitutedForAbsentAgendaItemIds || orig?.absentAgendaItemIds || [],
            };
          });

          const mappedGuests: AttendanceRecord[] = guests.map((g: any) => {
            let status: 'present' | 'pending' | 'absent' = 'pending';
            if (g.attendanceStatus === 'PRESENT') {
              status = 'present';
            } else if (g.attendanceStatus === 'ABSENT' || g.inviteStatus === 'DECLINED') {
              status = 'absent';
            }

            const orig = g.substituteForParticipantId 
              ? parts.find((x: any) => String(x.id) === String(g.substituteForParticipantId))
              : undefined;

            return {
              id: g.guestId || g.id,
              unit: g.company || '-',
              name: g.fullName,
              position: g.position || '-',
              status,
              reasonAbsent: g.note || undefined,
              type: 'guest',
              isFullSession: g.isFullSession,
              absentAgendaItemIds: g.absentAgendaItemIds || [],
              isSubstitute: g.isSubstitute,
              substitutedForUserName: g.substitutedForUserName || orig?.fullName,
              substitutedForIsFullSession: g.substitutedForIsFullSession !== undefined ? g.substitutedForIsFullSession : orig?.isFullSession,
              substitutedForAbsentAgendaItemIds: g.substitutedForAbsentAgendaItemIds || orig?.absentAgendaItemIds || [],
            };
          });

          setData([...mappedParticipants, ...mappedGuests]);
        }
      } catch (error) {
        console.error('Error fetching attendees:', error);
        toast.error('Không thể tải danh sách điểm danh');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendees();
  }, [isOpen, meetingId, guestToken]);

  const stats = useMemo(() => {
    return {
      total: data.length,
      present: data.filter((r) => r.status === 'present').length,
      pending: data.filter((r) => r.status === 'pending').length,
      absent: data.filter((r) => r.status === 'absent').length,
      donViCount: data.filter(r => r.type !== 'guest').length,
      khachMoiCount: data.filter(r => r.type === 'guest').length,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    let result = data;
    
    // Filter by tab
    if (activeTab === 'donvi') {
      result = result.filter(r => r.type !== 'guest');
    } else {
      result = result.filter(r => r.type === 'guest');
    }

    if (!searchQuery.trim()) return result;

    const query = searchQuery.toLowerCase();
    return result.filter(
      (record) => record.name.toLowerCase().includes(query)
    );
  }, [searchQuery, activeTab, data]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage]);

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">Có tham gia</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1 text-xs rounded-full border-none">Chưa xác nhận</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-3 py-1 text-xs rounded-full border-none">Báo vắng</Badge>;
    }
  };

  const tableConfig: TableEngineConfig<AttendanceRecord> = useMemo(() => {
    const baseColumns: ColumnDef<AttendanceRecord>[] = [
      { key: 'unit', header: 'Đơn vị' },
      { key: 'name', header: 'Họ và tên', className: 'font-medium' },
      { key: 'position', header: 'Chức vụ' },
    ];

    if (activeTab === 'donvi') {
      baseColumns.push({
        key: 'role',
        header: 'Vai trò',
        width: '130px',
        align: 'center',
        render: (row) => {
          if (row.role === 'CHAIR' || row.role === 'CHAIRPERSON' || row.isChair) {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-[#C8102E] border border-red-200">
                Chủ trì
              </span>
            );
          }
          if (row.role === 'SECRETARY') {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                Thư ký
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
              Đại biểu
            </span>
          );
        }
      });
    }

    // Thêm cột "Đại biểu đi thay" được thiết kế hợp lý, đẹp mắt
    baseColumns.push({
      key: 'replacementPerson',
      header: 'Đại biểu đi thay',
      width: '150px',
      className: 'whitespace-nowrap',
      render: (row) => {
        if (row.status === 'absent' && row.replacementPerson) {
          return (
            <div className="flex flex-col py-1 whitespace-nowrap">
              <span className="font-semibold text-gray-900 text-sm leading-tight whitespace-nowrap">
                {row.replacementPerson.name}
              </span>
              <span className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
                {row.replacementPerson.position}
              </span>
            </div>
          );
        }
        return <span className="text-gray-400 text-xs">-</span>;
      }
    });

    // Thêm cột "Ghi chú" (Vắng ở nội dung nào)
    baseColumns.push({
      key: 'absentAgendas',
      header: 'Ghi chú',
      width: '260px',
      render: (row) => {
        if (row.isSubstitute && row.substitutedForUserName) {
          let detail = "";
          if (row.substitutedForIsFullSession) {
            detail = "(Toàn phiên họp)";
          } else if (row.substitutedForAbsentAgendaItemIds && row.substitutedForAbsentAgendaItemIds.length > 0) {
            const titles = row.substitutedForAbsentAgendaItemIds
              .map((id) => agendaItems.find((a) => String(a.id) === String(id))?.title)
              .filter(Boolean);
            if (titles.length > 0) {
              detail = `(Nội dung: ${titles.join(', ')})`;
            }
          }
          const text = `Đi thay cho: ${row.substitutedForUserName} ${detail}`.trim();
          return (
            <TableTooltip 
              text={text} 
              maxLength={30} 
              className="text-blue-600 font-semibold text-sm cursor-pointer" 
            />
          );
        }
        if (row.status === 'absent') {
          if (row.isFullSession) {
            const text = "Vắng toàn bộ phiên họp";
            return <span className="text-red-600 font-medium text-sm">{text}</span>;
          }
          if (row.absentAgendaItemIds && row.absentAgendaItemIds.length > 0) {
            const titles = row.absentAgendaItemIds
              .map((id) => agendaItems.find((a) => String(a.id) === String(id))?.title)
              .filter(Boolean);
            if (titles.length > 0) {
              const text = `Vắng nội dung: ${titles.join(', ')}`;
              return (
                <TableTooltip 
                  text={text} 
                  maxLength={30} 
                  className="text-gray-600 text-sm font-medium cursor-pointer" 
                />
              );
            }
          }
        }
        return <span className="text-gray-400 text-xs">-</span>;
      }
    });

    // Thêm cột "Lý do vắng"
    baseColumns.push({
      key: 'reasonAbsent',
      header: 'Lý do vắng',
      width: '180px',
      render: (row) => row.status === 'absent' && row.reasonAbsent ? (
        <TableTooltip 
          text={row.reasonAbsent} 
          maxLength={22} 
          className="text-gray-600 text-sm cursor-pointer" 
        />
      ) : (
        <span className="text-gray-400 text-xs">-</span>
      )
    });

    // Thêm cột "Trạng thái"
    baseColumns.push({
      key: 'status',
      header: 'Trạng thái',
      render: (row) => getStatusBadge(row.status)
    });

    return {
      columns: baseColumns,
      rowActions: [], // Bỏ hoàn toàn cột thao tác theo yêu cầu
    };
  }, [activeTab, agendaItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[92vw] xl:max-w-[1450px] max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white z-10">
          <h2 className="text-xl heading text-gray-900">Danh sách điểm danh</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Tổng số', value: stats.total, color: 'from-gray-50 to-gray-100', text: 'text-gray-700' },
              { label: 'Có mặt', value: stats.present, color: 'from-green-50 to-green-100/50', text: 'text-green-700' },
              { label: 'Chưa xác nhận', value: stats.pending, color: 'from-amber-50 to-amber-100/50', text: 'text-amber-700' },
              { label: 'Báo vắng', value: stats.absent, color: 'from-red-50 to-red-100/50', text: 'text-red-700' },
            ].map((stat, i) => (
              <Card key={i} className={cn("border-none shadow-none bg-gradient-to-br", stat.color)}>
                <CardContent className="p-4">
                  <p className={cn("text-xs uppercase tracking-wider font-semibold mb-1", stat.text)}>{stat.label}</p>
                  <p className="text-3xl heading text-gray-900">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sliding Tabs Pattern */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-gray-50 p-1 border-b border-gray-200">
              <div className="relative flex w-full">
                <div 
                  className="absolute top-0 bottom-0 w-1/2 bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out"
                  style={{ transform: activeTab === 'donvi' ? 'translateX(0%)' : 'translateX(100%)' }}
                />
                {[
                  { id: 'donvi', label: 'Đơn vị', count: stats.donViCount },
                  { id: 'khachmoi', label: 'Khách mời', count: stats.khachMoiCount }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as TabType); setCurrentPage(1); }}
                    className={cn(
                      'relative w-1/2 py-2.5 text-sm font-medium transition-colors z-10',
                      activeTab === tab.id ? 'text-[#C8102E]' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {tab.label}
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs transition-colors',
                        activeTab === tab.id ? 'bg-red-50 text-[#C8102E]' : 'bg-gray-200 text-gray-600'
                      )}>
                        {tab.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-0 space-y-0">
              {/* DataToolbar for Search */}
              <DataToolbar
                searchQuery={searchQuery}
                onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                searchPlaceholder={`Tìm kiếm trong danh sách ${activeTab === 'donvi' ? 'đơn vị' : 'khách mời'}...`}
              />

              <div className="p-6 pt-2">
                {/* Table Engine Implementation */}
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <DataTable
                    data={paginatedData}
                    config={tableConfig}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filteredData.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-center bg-gray-50/50">
          <Button
            variant="primary"
            onClick={onClose}
            className="bg-[#C8102E] hover:bg-[#a80d26] px-12 rounded-full h-[44px]"
          >
            Đóng
          </Button>
        </div>
      </div>

      <AttendanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        record={selectedRecord}
      />
    </div>
  );
};

