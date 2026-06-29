import React, { useEffect, useState, useRef } from 'react';
import { Search, BookOpen, Trash2, Calendar, User, Download, Edit, CheckCircle2, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { toast } from '@/lib/toast';
import { personalApi, PersonalNoteResponse } from '../services/personal.api';
import { meetingApi } from '../services/meeting.api';
import { format } from 'date-fns';
import { Textarea } from '@/common/components/ui/textarea';
import { cn } from '@/common/utils/cn';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';

interface MeetingWithNotes {
  id: string;
  title: string;
  startTime: string;
  chairName?: string;
  locationName?: string;
  noteCount: number;
}

type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';

export default function PersonalNotesHubPage() {
  const [meetings, setMeetings] = useState<MeetingWithNotes[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithNotes | null>(null);

  // Notes details for the selected meeting
  const [notes, setNotes] = useState<PersonalNoteResponse[]>([]);
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all meetings that have user notes
  const fetchMeetingsWithNotes = async () => {
    setLoadingMeetings(true);
    try {
      const res = await personalApi.getMeetingsWithNotes();
      if (res.success && res.data) {
        setMeetings(res.data);
        if (res.data.length > 0 && !selectedMeetingId) {
          setSelectedMeetingId(res.data[0].id);
          setSelectedMeeting(res.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching meetings with notes:', error);
      toast.error('Lỗi', 'Không thể tải danh sách cuộc họp có ghi chú.');
    } finally {
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    fetchMeetingsWithNotes();
  }, []);

  // Fetch notes & agenda contents when selected meeting changes
  const fetchNotesAndContents = async (meetingId: string) => {
    setLoadingNotes(true);

    // Fetch notes independently - don't let agenda failure block notes
    try {
      const notesRes = await personalApi.getNotesForMeeting(meetingId);
      if (notesRes.success && notesRes.data) {
        setNotes(notesRes.data);
      } else {
        console.warn('Notes response unsuccessful:', notesRes);
        setNotes([]);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    }

    // Fetch agenda contents independently
    try {
      const contentsRes = await meetingApi.getAgendaItems(meetingId);
      if (contentsRes.success && contentsRes.data) {
        setAgendaItems(contentsRes.data);
      }
    } catch (error) {
      console.error('Error fetching agenda contents:', error);
    }

    setLoadingNotes(false);
  };

  useEffect(() => {
    if (selectedMeetingId) {
      fetchNotesAndContents(selectedMeetingId);
      setEditingNoteId(null);
      setSaveStatus('idle');
    } else {
      setNotes([]);
      setAgendaItems([]);
      setSelectedMeeting(null);
    }
  }, [selectedMeetingId]);

  const handleSelectMeeting = (m: MeetingWithNotes) => {
    setSelectedMeetingId(m.id);
    setSelectedMeeting(m);
  };

  // Start editing a note
  const startEditing = (note: PersonalNoteResponse) => {
    setEditingNoteId(note.id);
    setEditContent(note.noteContent);
    setSaveStatus('idle');
  };

  // Debounced auto-save edit handler
  const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEditContent(value);
    setSaveStatus('typing');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      saveEditToServer(value);
    }, 1000);
  };

  const saveEditToServer = async (content: string) => {
    if (!editingNoteId) return;
    setSaveStatus('saving');
    try {
      const note = notes.find((n) => n.id === editingNoteId);
      if (!note) return;

      const res = await personalApi.updateNote(editingNoteId, {
        meetingId: selectedMeetingId,
        agendaItemId: note.agendaItemId,
        noteContent: content,
      });

      if (res.success && res.data) {
        setNotes((prev) =>
          prev.map((n) => (n.id === editingNoteId ? res.data! : n))
        );
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving note edit:', error);
      setSaveStatus('error');
    }
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    try {
      await personalApi.deleteNote(noteToDelete);
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete));
      if (editingNoteId === noteToDelete) {
        setEditingNoteId(null);
      }
      toast.success('Xóa ghi chú thành công.');
      // Refresh sidebar meeting counts
      fetchMeetingsWithNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Lỗi', 'Không thể xóa ghi chú.');
    } finally {
      setDeleteConfirmOpen(false);
      setNoteToDelete(null);
    }
  };

  // Export notes for the selected meeting
  const handleExport = () => {
    if (!selectedMeeting || notes.length === 0) return;

    const generalNote = notes.find((n) => !n.agendaItemId);
    
    let text = `GHI CHÚ PHIÊN HỌP CÁ NHÂN\n`;
    text += `=========================================\n`;
    text += `Phiên họp: ${selectedMeeting.title}\n`;
    text += `Người chủ trì: ${selectedMeeting.chairName || 'Chưa xác định'}\n`;
    text += `Thời gian: ${format(new Date(selectedMeeting.startTime), 'dd/MM/yyyy HH:mm')}\n`;
    text += `Xuất ngày: ${new Date().toLocaleString('vi-VN')}\n`;
    text += `=========================================\n\n`;

    text += `[GHI CHÚ CHUNG CHO PHIÊN HỌP]\n`;
    text += `-----------------------------------------\n`;
    text += generalNote ? generalNote.noteContent : `(Không có ghi chú)\n`;
    text += `\n\n`;

    agendaItems.forEach((item, index) => {
      const itemNote = notes.find((n) => n.agendaItemId === String(item.id));
      text += `[NỘI DUNG ${index + 1}: ${item.title}]\n`;
      text += `-----------------------------------------\n`;
      text += itemNote ? itemNote.noteContent : `(Không có ghi chú)\n`;
      text += `\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ghi_chu_${selectedMeeting.title.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const filteredMeetings = meetings.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <PageHeader
        title="Ghi chú của tôi"
        breadcrumbs={[
          { name: 'Trang chủ', path: '/' },
          { name: 'Cá nhân' },
          { name: 'Ghi chú của tôi' },
        ]}
      />

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
        {/* Left Column: Meetings Sidebar List (35%) */}
        <div className="col-span-12 md:col-span-4 bg-white border border-gray-200 rounded-3xl p-4 flex flex-col h-full overflow-hidden shadow-sm">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm phiên họp có ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>

          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Danh sách phiên họp</span>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {loadingMeetings ? (
              <div className="text-center py-8 text-gray-500 font-medium">
                Đang tải danh sách...
              </div>
            ) : filteredMeetings.length > 0 ? (
              filteredMeetings.map((m) => {
                const isSelected = selectedMeetingId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMeeting(m)}
                    className={cn(
                      'w-full text-left p-4 rounded-2xl transition-all duration-250 flex flex-col gap-1.5 border border-transparent',
                      isSelected
                        ? 'bg-red-50/70 border-red-100 text-[#C8102E]'
                        : 'hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <span className="font-bold text-sm line-clamp-2 leading-snug">
                      {m.title}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(m.startTime), 'dd/MM/yyyy')}
                      </span>
                      <span className="bg-gray-150 px-2 py-0.5 rounded-full font-medium text-gray-500">
                        {m.noteCount} ghi chú
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">
                Không tìm thấy phiên họp nào.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Note Viewer & Editor (65%) */}
        <div className="col-span-12 md:col-span-8 bg-white border border-gray-200 rounded-3xl flex flex-col h-full overflow-hidden shadow-sm">
          {selectedMeeting ? (
            <>
              {/* Note Header Info */}
              <div className="p-6 border-b border-gray-150 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-1">
                    {selectedMeeting.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-550 mt-1.5 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {format(new Date(selectedMeeting.startTime), 'HH:mm dd/MM/yyyy')}
                    </span>
                    {selectedMeeting.chairName && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        Chủ trì: {selectedMeeting.chairName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes Body content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingNotes ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#C8102E]" />
                  </div>
                ) : notes.length > 0 ? (
                  <>
                    {/* General Notes section */}
                    {notes.some((n) => !n.agendaItemId) && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Ghi chú chung cuộc họp
                        </span>
                        {notes
                          .filter((n) => !n.agendaItemId)
                          .map((n) => renderNoteCard(n, 'Ghi chú chung cuộc họp'))}
                      </div>
                    )}

                    {/* Agenda items notes section */}
                    {notes.some((n) => n.agendaItemId) && (
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block border-t border-gray-100 pt-4">
                          Ghi chú nội dung thảo luận
                        </span>
                        <div className="space-y-4">
                          {notes
                            .filter((n) => n.agendaItemId)
                            .map((n) => {
                              const agendaTitle =
                                n.agendaItemTitle ||
                                agendaItems.find((a) => String(a.id) === n.agendaItemId)?.title ||
                                'Nội dung phiên họp';
                              return renderNoteCard(n, agendaTitle);
                            })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                    <BookOpen className="h-10 w-10 text-gray-300 mb-2" />
                    <span>Không tìm thấy nội dung ghi chú.</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <BookOpen className="h-12 w-12 text-gray-300 mb-2" />
              <span className="font-semibold text-sm">Chọn một cuộc họp để xem ghi chú cá nhân của bạn</span>
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setNoteToDelete(null);
        }}
        className="sm:max-w-md"
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-lg font-bold text-gray-900">Xác nhận xóa ghi chú</span>
          </div>
        }
      >
        <div className="py-2">
          <p className="text-sm text-gray-650">
            Bạn có chắc chắn muốn xóa ghi chú này? Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDeleteConfirmOpen(false);
              setNoteToDelete(null);
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmDelete}
          >
            Xác nhận xóa
          </Button>
        </div>
      </Modal>
    </div>
  );

  // Render a note block
  function renderNoteCard(note: PersonalNoteResponse, title: string) {
    const isEditing = editingNoteId === note.id;

    return (
      <div
        key={note.id}
        className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-[#C8102E] focus-within:border-transparent"
      >
        <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-150 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-800 leading-snug">{title}</span>
          <div className="flex items-center gap-1">
            {isEditing && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mr-2">
                {saveStatus === 'typing' && <span>Đang nhập...</span>}
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                    Đang lưu...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Đã lưu
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="flex items-center gap-1 text-red-650 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Lỗi lưu
                  </span>
                )}
              </div>
            )}
            {!isEditing && (
              <button
                onClick={() => startEditing(note)}
                className="px-2.5 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-blue-100"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Sửa</span>
              </button>
            )}
            <button
              onClick={() => handleDeleteNote(note.id)}
              className="px-2.5 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-red-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={handleEditChange}
              placeholder="Nhập nội dung ghi chú..."
              rows={4}
              className="w-full border-none resize-none p-0 focus-visible:ring-0 text-sm leading-relaxed text-gray-800 bg-white"
            />
          ) : (
            <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {note.noteContent || <span className="text-gray-400 italic">Trống</span>}
            </div>
          )}
          <div className="flex justify-between items-center text-[10px] text-gray-400 mt-4 border-t border-gray-50 pt-2 font-medium">
            <span>Ngày tạo: {format(new Date(note.createdAt), 'dd/MM/yyyy HH:mm')}</span>
            {note.updatedAt && (
              <span>Cập nhật lúc: {format(new Date(note.updatedAt), 'dd/MM/yyyy HH:mm')}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
}
