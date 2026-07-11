import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Save, Trash2, Download, CheckCircle2, Loader2, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

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

  if (!isOpen) return null;

  return (
    <div className={cn("fixed right-6 bottom-6 h-[640px] max-h-[85vh] z-50 bg-[#F8FAFC] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 animate-in slide-in-from-bottom-5 duration-200", isSidebarExpanded ? "w-[720px]" : "w-[540px]")}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-50 text-[#C8102E] shadow-sm shadow-red-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">Ghi chú cuộc họp cá nhân</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Ghi chú riêng tư, chỉ hiển thị với riêng bạn</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Agenda Content List */}
        <div className={cn("bg-white border-r border-slate-200/80 flex flex-col transition-all duration-300", isSidebarExpanded ? "w-[260px]" : "w-[72px]")}>
          {isSidebarExpanded ? (
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh mục</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                  {agendaItems.length + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSidebarExpanded(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  title="Thu gọn danh mục"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 border-b border-slate-100 flex flex-col items-center justify-center bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsSidebarExpanded(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                title="Mở rộng danh mục"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {isSidebarExpanded ? (
              <>
                {/* General Meeting Item - Expanded */}
                <button
                  type="button"
                  onClick={() => setSelectedItemId('GENERAL')}
                  className={cn(
                    'w-full text-left p-3.5 rounded-xl transition-all duration-200 flex flex-col gap-1 border relative group',
                    selectedItemId === 'GENERAL'
                      ? 'bg-red-50/40 border-red-150 text-[#C8102E] shadow-sm'
                      : 'hover:bg-slate-50/80 border-transparent text-gray-700'
                  )}
                >
                  {selectedItemId === 'GENERAL' && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-[#C8102E]" />
                  )}
                  
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-[10px] tracking-wide text-slate-450 uppercase group-hover:text-red-700/80 transition-colors">
                      Tổng quan
                    </span>
                    {notes.some((n) => !n.agendaItemId) ? (
                      <span className="text-[9px] bg-emerald-55 text-emerald-700 font-semibold px-1.5 py-0.5 rounded border border-emerald-100">
                        Đã lưu
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded">
                        Trống
                      </span>
                    )}
                  </div>
                  
                  <span className="font-semibold text-sm mt-0.5 block truncate max-w-[210px]">
                    Ghi chú chung
                  </span>
                  
                  <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-normal">
                    {notes.find((n) => !n.agendaItemId)?.noteContent || 'Chưa ghi chú...'}
                  </p>
                </button>

                <div className="h-px bg-slate-100 my-1 mx-2" />

                {/* Agenda Items - Expanded */}
                {agendaItems.map((item, index) => {
                  const isSelected = selectedItemId === item.id;
                  const note = notes.find((n) => n.agendaItemId === item.id);
                  const hasNote = !!note;
                  const orderNumber = item.orderNo || index + 1;
                  
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItemId(item.id)}
                      className={cn(
                        'w-full text-left p-3.5 rounded-xl transition-all duration-200 flex flex-col gap-1 border relative group',
                        isSelected
                          ? 'bg-red-50/40 border-red-150 text-[#C8102E] shadow-sm'
                          : 'hover:bg-slate-50/80 border-transparent text-gray-700'
                      )}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-[#C8102E]" />
                      )}
                      
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-[10px] tracking-wide text-slate-450 uppercase group-hover:text-red-700/80 transition-colors">
                          Nội dung {orderNumber}
                        </span>
                        {hasNote ? (
                          <span className="text-[9px] bg-emerald-55 text-emerald-700 font-semibold px-1.5 py-0.5 rounded border border-emerald-100">
                            Đã lưu
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded">
                            Trống
                          </span>
                        )}
                      </div>
                      
                      <span className="font-semibold text-sm mt-0.5 block truncate max-w-[210px]">
                        {item.title}
                      </span>
                      
                      <p className="text-xs italic text-slate-400 line-clamp-1 mt-1 font-normal">
                        {note?.noteContent || 'Chưa ghi chú...'}
                      </p>
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                {/* General Meeting Item - Collapsed */}
                <button
                  type="button"
                  onClick={() => setSelectedItemId('GENERAL')}
                  title="Tổng quan cuộc họp"
                  className={cn(
                    'w-11 h-11 mx-auto rounded-xl transition-all duration-200 flex items-center justify-center border relative group',
                    selectedItemId === 'GENERAL'
                      ? 'bg-red-50 text-[#C8102E] border-red-150 shadow-sm'
                      : 'hover:bg-slate-50 border-transparent text-slate-500'
                  )}
                >
                  <BookOpen className="h-5 w-5" />
                  {notes.some((n) => !n.agendaItemId) && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 border border-white" />
                  )}
                </button>

                <div className="h-px bg-slate-100 my-1 mx-1" />

                {/* Agenda Items - Collapsed */}
                {agendaItems.map((item, index) => {
                  const isSelected = selectedItemId === item.id;
                  const hasNote = notes.some((n) => n.agendaItemId === item.id);
                  const orderNumber = item.orderNo || index + 1;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItemId(item.id)}
                      title={`Nội dung ${orderNumber}: ${item.title}`}
                      className={cn(
                        'w-11 h-11 mx-auto rounded-xl transition-all duration-200 flex items-center justify-center border relative group font-bold text-xs',
                        isSelected
                          ? 'bg-red-50 text-[#C8102E] border-red-150 shadow-sm'
                          : 'hover:bg-slate-50 border-transparent text-slate-500'
                      )}
                    >
                      <span>{orderNumber}</span>
                      {hasNote && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Note Editor */}
        <div className="flex-1 flex flex-col h-full bg-[#F8FAFC]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#C8102E] mb-2" />
              <span className="text-sm text-gray-500 font-medium">Đang tải ghi chú...</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
              
              {/* Meta details of selected item */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-[#C8102E] bg-red-50 px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
                    {selectedItemId === 'GENERAL' ? 'Ghi chú chung' : 'Ghi chú nội dung'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 leading-snug">
                  {selectedItemId === 'GENERAL'
                    ? `Chung cho cuộc họp: ${meetingTitle}`
                    : agendaItems.find((a) => a.id === selectedItemId)?.title}
                </h4>
                {selectedItemId !== 'GENERAL' && agendaItems.find((a) => a.id === selectedItemId)?.description && (
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed border-t border-slate-50 pt-2">
                    {agendaItems.find((a) => a.id === selectedItemId)?.description}
                  </p>
                )}
              </div>

              {/* Editor Textarea */}
              <div className="flex-1 min-h-[250px] flex flex-col bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#C8102E]/20 focus-within:border-[#C8102E] transition-all">
                
                {/* Status Bar */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-550">
                    {saveStatus === 'typing' && (
                      <span className="text-slate-500 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-ping" />
                        Đang nhập...
                      </span>
                    )}
                    {saveStatus === 'saving' && (
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang tự động lưu...
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50/50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Đã lưu
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="flex items-center gap-1.5 text-red-650 font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-100/50">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        Lỗi lưu tự động
                      </span>
                    )}
                    {saveStatus === 'idle' && (
                      <span className="text-slate-400 font-normal">Tự động lưu sau khi dừng nhập</span>
                    )}
                  </div>

                  {currentNote && (
                    <button
                      type="button"
                      onClick={handleDeleteNote}
                      className="text-red-650 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold border border-red-100 bg-white shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      <span>Xóa ghi chú</span>
                    </button>
                  )}
                </div>

                {/* Textarea Area */}
                <textarea
                  value={noteContent}
                  onChange={handleContentChange}
                  placeholder={
                    selectedItemId === 'GENERAL'
                      ? 'Nhập ghi chú chung cho toàn bộ phiên họp...'
                      : 'Nhập ghi chú chi tiết cho nội dung thảo luận này...'
                  }
                  className="flex-1 w-full p-4 border-none resize-none focus:outline-none focus:ring-0 text-sm leading-relaxed text-gray-800 placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        className="sm:max-w-md"
        title={
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-gray-900">Xác nhận xóa ghi chú</span>
          </div>
        }
      >
        <div className="py-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            Bạn có chắc chắn muốn xóa ghi chú này? Nội dung ghi chú sẽ bị xóa vĩnh viễn và không thể khôi phục lại.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="danger"
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirmDelete}
          >
            Xác nhận xóa
          </Button>
        </div>
      </Modal>
    </div>
  );
};
