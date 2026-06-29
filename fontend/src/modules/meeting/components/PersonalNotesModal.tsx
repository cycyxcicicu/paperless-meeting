import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Save, Trash2, Download, CheckCircle2, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';
import { Textarea } from '@/common/components/ui/textarea';
import { cn } from '@/common/utils/cn';
import { toast } from '@/lib/toast';
import { personalApi, PersonalNoteResponse } from '../services/personal.api';

interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  orderNo?: number;
}

interface PersonalNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle: string;
  agendaItems: AgendaItem[];
}

type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';

export const PersonalNotesModal: React.FC<PersonalNotesModalProps> = ({
  isOpen,
  onClose,
  meetingId,
  meetingTitle,
  agendaItems,
}) => {
  // State for notes fetched from server
  const [notes, setNotes] = useState<PersonalNoteResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected item: 'GENERAL' (general meeting note) or specific agendaItemId (string)
  const [selectedItemId, setSelectedItemId] = useState<string>('GENERAL');
  const [noteContent, setNoteContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all user notes for this meeting
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await personalApi.getNotesForMeeting(meetingId);
      if (res.success && res.data) {
        setNotes(res.data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Lỗi', 'Không thể tải ghi chú cá nhân.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && meetingId) {
      fetchNotes();
      setSelectedItemId('GENERAL');
    }
  }, [isOpen, meetingId]);

  // Find the note corresponding to the selected item
  const currentNote = notes.find((n) => {
    if (selectedItemId === 'GENERAL') {
      return !n.agendaItemId;
    }
    return n.agendaItemId === selectedItemId;
  });

  // Sync editor content with database note when selected item changes
  useEffect(() => {
    if (currentNote) {
      setNoteContent(currentNote.noteContent);
    } else {
      setNoteContent('');
    }
    setSaveStatus('idle');
  }, [selectedItemId, notes]);

  // Auto-save logic
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNoteContent(value);
    setSaveStatus('typing');

    // Debounce save for 1 second
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      saveNoteToServer(value);
    }, 1000);
  };

  // Perform API call to save note
  const saveNoteToServer = async (content: string) => {
    setSaveStatus('saving');
    try {
      const agendaItemId = selectedItemId === 'GENERAL' ? null : selectedItemId;
      
      if (currentNote) {
        // Update existing note
        const res = await personalApi.updateNote(currentNote.id, {
          meetingId,
          agendaItemId,
          noteContent: content,
        });
        if (res.success && res.data) {
          setNotes((prev) =>
            prev.map((n) => (n.id === currentNote.id ? res.data! : n))
          );
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } else {
        // Create new note
        const res = await personalApi.createNote({
          meetingId,
          agendaItemId,
          noteContent: content,
        });
        if (res.success && res.data) {
          setNotes((prev) => [...prev, res.data!]);
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setSaveStatus('error');
    }
  };

  // Delete note manually
  const handleDeleteNote = () => {
    if (!currentNote) return;
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentNote) return;
    try {
      await personalApi.deleteNote(currentNote.id);
      setNotes((prev) => prev.filter((n) => n.id !== currentNote.id));
      setNoteContent('');
      setSaveStatus('idle');
      toast.success('Xóa ghi chú thành công');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Lỗi', 'Không thể xóa ghi chú.');
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // Clean up typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Export all notes as a TXT file
  const handleExportNotes = () => {
    if (notes.length === 0) {
      toast.info('Thông báo', 'Bạn chưa lưu ghi chú nào cho phiên họp này.');
      return;
    }

    const generalNote = notes.find((n) => !n.agendaItemId);
    
    let text = `GHI CHÚ PHIÊN HỌP CÁ NHÂN\n`;
    text += `=========================================\n`;
    text += `Phiên họp: ${meetingTitle}\n`;
    text += `Xuất ngày: ${new Date().toLocaleString('vi-VN')}\n`;
    text += `=========================================\n\n`;

    text += `[GHI CHÚ CHUNG CHO PHIÊN HỌP]\n`;
    text += `-----------------------------------------\n`;
    text += generalNote ? generalNote.noteContent : `(Không có ghi chú)\n`;
    text += `\n\n`;

    agendaItems.forEach((item, index) => {
      const itemNote = notes.find((n) => n.agendaItemId === item.id);
      text += `[NỘI DUNG ${item.orderNo || index + 1}: ${item.title}]\n`;
      text += `-----------------------------------------\n`;
      text += itemNote ? itemNote.noteContent : `(Không có ghi chú)\n`;
      text += `\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ghi_chu_${meetingTitle.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Main Container */}
      <div className="relative bg-[#F8FAFC] rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-250">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50 text-[#C8102E]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Ghi chú cuộc họp cá nhân</h3>
              <p className="text-xs text-gray-500 font-medium">Ghi chú riêng tư, chỉ hiển thị với riêng bạn</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Agenda Content List (40% width) */}
          <div className="w-[40%] bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danh mục nội dung</span>
            </div>
            <div className="p-2 space-y-1">
              {/* General Meeting Item */}
              <button
                type="button"
                onClick={() => setSelectedItemId('GENERAL')}
                className={cn(
                  'w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex flex-col gap-1 border border-transparent',
                  selectedItemId === 'GENERAL'
                    ? 'bg-red-50/70 border-red-100 text-[#C8102E]'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-sm">Ghi chú chung cuộc họp</span>
                  {notes.some((n) => !n.agendaItemId) && (
                    <span className="h-2 w-2 rounded-full bg-[#C8102E]" />
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate w-full">
                  {notes.find((n) => !n.agendaItemId)?.noteContent || 'Chưa ghi chú'}
                </p>
              </button>

              {/* Agenda Items */}
              {agendaItems.map((item, index) => {
                const isSelected = selectedItemId === item.id;
                const hasNote = notes.some((n) => n.agendaItemId === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={cn(
                      'w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex flex-col gap-1 border border-transparent',
                      isSelected
                        ? 'bg-red-50/70 border-red-100 text-[#C8102E]'
                        : 'hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-sm">
                        Nội dung {item.orderNo || index + 1}: {item.title}
                      </span>
                      {hasNote && <span className="h-2 w-2 rounded-full bg-[#C8102E]" />}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs italic text-gray-500 line-clamp-1 mt-1">
                      {notes.find((n) => n.agendaItemId === item.id)?.noteContent || 'Chưa ghi chú'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Note Editor (60% width) */}
          <div className="w-[60%] flex flex-col h-full bg-[#F8FAFC]">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#C8102E] mb-2" />
                <span className="text-sm text-gray-500 font-medium">Đang tải ghi chú...</span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
                {/* Meta details of selected item */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs font-bold text-[#C8102E] bg-red-50/70 px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
                    {selectedItemId === 'GENERAL' ? 'Ghi chú chung' : 'Ghi chú nội dung'}
                  </span>
                  <h4 className="text-base font-bold text-gray-900 leading-snug">
                    {selectedItemId === 'GENERAL'
                      ? `Chung cho cuộc họp: ${meetingTitle}`
                      : agendaItems.find((a) => a.id === selectedItemId)?.title}
                  </h4>
                  {selectedItemId !== 'GENERAL' && agendaItems.find((a) => a.id === selectedItemId)?.description && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      {agendaItems.find((a) => a.id === selectedItemId)?.description}
                    </p>
                  )}
                </div>

                {/* Editor Textarea */}
                <div className="flex-1 min-h-[300px] flex flex-col bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#C8102E] focus-within:border-transparent transition-all">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-b border-gray-150">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      {saveStatus === 'typing' && <span>Đang nhập...</span>}
                      {saveStatus === 'saving' && (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                          Đang tự động lưu...
                        </span>
                      )}
                      {saveStatus === 'saved' && (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Đã tự động lưu
                        </span>
                      )}
                      {saveStatus === 'error' && (
                        <span className="flex items-center gap-1 text-red-650 font-semibold">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Lỗi lưu tự động
                        </span>
                      )}
                      {saveStatus === 'idle' && (
                        <span>Tự động lưu sau khi nhập xong</span>
                      )}
                    </div>

                    {currentNote && (
                      <button
                        type="button"
                        onClick={handleDeleteNote}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Xóa ghi chú</span>
                      </button>
                    )}
                  </div>

                  <Textarea
                    value={noteContent}
                    onChange={handleContentChange}
                    placeholder={
                      selectedItemId === 'GENERAL'
                        ? 'Nhập ghi chú chung cho toàn bộ phiên họp tại đây...'
                        : 'Nhập ghi chú chi tiết cho nội dung thảo luận này...'
                    }
                    className="flex-1 w-full p-5 border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
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
            onClick={() => setDeleteConfirmOpen(false)}
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
};
