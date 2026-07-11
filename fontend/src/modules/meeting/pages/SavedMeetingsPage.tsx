import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Eye, Search, Bookmark, Trash2, Calendar, Clock, User, ArrowRight, Play, BookOpen, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { Pagination } from '@/common/components/ui/app-pagination';
import { toast } from '@/lib/toast';
import { personalApi } from '../services/personal.api';
import { format } from 'date-fns';
import { Badge } from '@/common/components/ui/badge';
import { PersonalNotesModal } from '../components/PersonalNotesModal';
import { meetingApi } from '../services/meeting.api';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';

interface SavedMeeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  chairName?: string;
  locationName?: string;
  onlineLink?: string;
  status: string;
  callerRole?: string;
  callerInviteStatus?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "info" | "default" | "destructive" | "secondary" }> = {
  DRAFT: { label: "Nháp", variant: "warning" },
  PENDING_APPROVAL: { label: "Chờ phê duyệt", variant: "info" },
  APPROVED: { label: "Đã phê duyệt", variant: "success" },
  REJECTED: { label: "Từ chối duyệt", variant: "destructive" },
  IN_PROGRESS: { label: "Đang diễn ra", variant: "success" },
  COMPLETED: { label: "Đã kết thúc", variant: "secondary" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
  UPCOMING: { label: "Sắp diễn ra", variant: "info" },
};

export default function SavedMeetingsPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<SavedMeeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Note Modal States
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [selectedMeetingTitle, setSelectedMeetingTitle] = useState('');
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [unsaveConfirmOpen, setUnsaveConfirmOpen] = useState(false);
  const [meetingToUnsave, setMeetingToUnsave] = useState<string | null>(null);

  const fetchSavedMeetings = async () => {
    setLoading(true);
    try {
      const res = await personalApi.getSavedMeetings();
      if (res.success && res.data && res.data.content) {
        // Map backend response array to list
        const list = res.data.content.map((m: any) => ({
          id: m.id,
          title: m.title,
          startTime: m.startTime,
          endTime: m.endTime,
          chairName: m.chairName,
          locationName: m.locationName,
          onlineLink: m.onlineLink,
          status: m.status,
          callerRole: m.callerRole,
          callerInviteStatus: m.callerInviteStatus,
        }));
        setMeetings(list);
      }
    } catch (error) {
      console.error('Error fetching saved meetings:', error);
      toast.error('Lỗi', 'Không thể tải danh sách phiên họp đã lưu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedMeetings();
  }, []);

  const handleRemoveSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMeetingToUnsave(id);
    setUnsaveConfirmOpen(true);
  };

  const handleConfirmUnsave = async () => {
    if (!meetingToUnsave) return;
    try {
      const res = await personalApi.toggleSaveMeeting(meetingToUnsave);
      if (res.success) {
        toast.success('Đã bỏ lưu tài liệu phiên họp.');
        setMeetings((prev) => prev.filter((m) => m.id !== meetingToUnsave));
      }
    } catch (error) {
      console.error('Error removing save:', error);
      toast.error('Lỗi', 'Không thể thực hiện hành động.');
    } finally {
      setUnsaveConfirmOpen(false);
      setMeetingToUnsave(null);
    }
  };

  const handleOpenNotes = async (e: React.MouseEvent, meetingId: string, meetingTitle: string) => {
    e.stopPropagation();
    setSelectedMeetingId(meetingId);
    setSelectedMeetingTitle(meetingTitle);
    setAgendaItems([]);
    setIsNoteModalOpen(true);

    try {
      // Fetch agenda contents for this meeting to pass to notes modal
      const res = await meetingApi.getAgendaItems(meetingId);
      if (res.success && res.data) {
        const items = res.data.map((c: any) => ({
          id: String(c.id),
          title: c.title,
          description: c.content,
          orderNo: c.orderNo,
        }));
        setAgendaItems(items);
      }
    } catch (error) {
      console.error('Error fetching meeting contents:', error);
      // Fallback silently to allow notes creation at meeting level
    }
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter(
      (m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.chairName && m.chairName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [meetings, searchQuery]);

  const totalPages = Math.ceil(filteredMeetings.length / pageSize);
  const paginatedMeetings = filteredMeetings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatMeetingTime = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')} ngày ${format(start, 'dd/MM/yyyy')}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Phiên họp đã lưu"
        breadcrumbs={[
          { name: 'Trang chủ', path: '/' },
          { name: 'Cá nhân' },
          { name: 'Phiên họp đã lưu' },
        ]}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm phiên họp đã lưu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table grid layout */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[60px]">STT</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phiên họp</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[200px]">Thời gian</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[180px]">Người chủ trì</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[140px]">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-[320px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Đang tải danh sách phiên họp...
                  </td>
                </tr>
              ) : paginatedMeetings.length > 0 ? (
                paginatedMeetings.map((m, index) => {
                  const statusInfo = STATUS_MAP[m.status] || { label: m.status, variant: 'default' };
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/phien-hop/${m.id}`)}>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {String((currentPage - 1) * pageSize + index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 max-w-md">
                          <span className="text-sm font-bold text-gray-900 group-hover:text-[#C8102E] transition-colors line-clamp-2">
                            {m.title}
                          </span>
                          {m.locationName && (
                            <span className="text-xs text-gray-400 truncate">
                              Địa điểm: {m.locationName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-650">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>{formatMeetingTime(m.startTime, m.endTime)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-650">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span>{m.chairName || 'Chưa xác định'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusInfo.variant} className="text-xs py-0.5 px-2 font-medium">
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => navigate(`/phien-hop/${m.id}`)}
                            className="px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem</span>
                          </button>
                          {m.status === 'IN_PROGRESS' &&
                            (m.callerRole === 'CREATOR' ||
                              m.callerRole === 'SECRETARY' ||
                              m.callerRole === 'CHAIR' ||
                              m.callerRole === 'CHAIRPERSON' ||
                              (!!m.callerInviteStatus && m.callerInviteStatus !== 'DECLINED')) && (
                            <button
                              onClick={() => navigate(`/phien-hop/${m.id}/dien-bien`)}
                              className="px-2 py-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-100 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold"
                              title="Vào diễn biến họp"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Vào họp</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => handleOpenNotes(e, m.id, m.title)}
                            className="px-2 py-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border border-amber-100 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold"
                            title="Ghi chú cá nhân"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Ghi chú</span>
                          </button>
                          <button
                            onClick={(e) => handleRemoveSave(e, m.id)}
                            className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold"
                            title="Bỏ lưu"
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                            <span>Bỏ lưu</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Không có phiên họp đã lưu nào được tìm thấy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredMeetings.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredMeetings.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="phiên họp"
          />
        )}
      </div>

      {/* Render Note Modal */}
      {isNoteModalOpen && (
        <PersonalNotesModal
          isOpen={isNoteModalOpen}
          onClose={() => {
            setIsNoteModalOpen(false);
            fetchSavedMeetings(); // reload list in case notes preview updated
          }}
          meetingId={selectedMeetingId}
          meetingTitle={selectedMeetingTitle}
          agendaItems={agendaItems}
        />
      )}

      <Modal
        isOpen={unsaveConfirmOpen}
        onClose={() => {
          setUnsaveConfirmOpen(false);
          setMeetingToUnsave(null);
        }}
        className="sm:max-w-md"
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-lg font-bold text-gray-900">Bỏ lưu tài liệu phiên họp</span>
          </div>
        }
      >
        <div className="py-2">
          <p className="text-sm text-gray-650">
            Bạn có chắc chắn muốn bỏ lưu tài liệu phiên họp này?
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setUnsaveConfirmOpen(false);
              setMeetingToUnsave(null);
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmUnsave}
          >
            Xác nhận
          </Button>
        </div>
      </Modal>
    </div>
  );
}
