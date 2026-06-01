import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, MapPin, Clock, AlertCircle, CheckCircle2, FileUp, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/app/context/AuthContext';
import { meetingApi, MeetingResponse, AgendaItemResponse } from '../services/meeting.api';
import { FileUploader } from '@/common/components/ui/FileUploader';
import { Button } from '@/common/components/ui/button';
import { toast } from '@/lib/toast';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Bản nháp', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  PENDING_PREPARATION: { label: 'Chờ chuẩn bị tài liệu', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  PENDING_APPROVAL: { label: 'Chờ duyệt tài liệu', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Đã duyệt tài liệu', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Bị từ chối - Yêu cầu sửa đổi', className: 'bg-red-50 text-red-700 border-red-200' },
};

export default function PrepareDocumentsPage() {
  const { id: meetingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState<MeetingResponse | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  
  // Track files for each agenda item: agendaItemId -> array of File objects
  const [agendaFiles, setAgendaFiles] = useState<Record<string, File[]>>({});

  const loadData = async () => {
    if (!meetingId) return;
    setLoading(true);
    try {
      const [meetingRes, agendaRes] = await Promise.all([
        meetingApi.getMeetingById(meetingId),
        meetingApi.getAgendaItems(meetingId)
      ]);

      if (meetingRes.success && meetingRes.data) {
        setMeeting(meetingRes.data);
      } else {
        toast.error("Lỗi", "Không thể tải thông tin cuộc họp.");
      }

      if (agendaRes.success && agendaRes.data) {
        setAgendaItems(agendaRes.data);

        // Initialize files state for each agenda item
        const initialFiles: Record<string, File[]> = {};
        agendaRes.data.forEach(item => {
          initialFiles[item.id] = (item.documents || []).map(doc => {
            // Reconstruct a File-like object from document response
            const mockFile = new File([], doc.fileName || doc.title || "Tài liệu", { type: "application/octet-stream" });
            Object.defineProperty(mockFile, 'size', { value: doc.fileSize || 0 });
            // Add custom documentId property to distinguish existing files
            Object.defineProperty(mockFile, 'documentId', { value: doc.documentId, writable: true });
            return mockFile;
          });
        });
        setAgendaFiles(initialFiles);
      } else {
        toast.error("Lỗi", "Không thể tải chương trình họp.");
      }
    } catch (error) {
      console.error("Error loading preparation data:", error);
      toast.error("Lỗi kết nối", "Đã xảy ra lỗi khi tải dữ liệu từ máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [meetingId]);

  // Filter agenda items that are assigned to the current user
  const assignedItems = agendaItems.filter(item => item.preparedByUserId === user?.id);

  const handleFileChange = (agendaItemId: string, files: File[]) => {
    setAgendaFiles(prev => ({
      ...prev,
      [agendaItemId]: files
    }));
  };

  const handleSubmitDocs = async (agendaItemId: string) => {
    const files = agendaFiles[agendaItemId] || [];
    if (files.length === 0) {
      toast.warning("Chưa có tài liệu", "Vui lòng chọn hoặc kéo thả ít nhất 1 tài liệu để gửi.");
      return;
    }

    setSubmitting(prev => ({ ...prev, [agendaItemId]: true }));
    try {
      const documentIds: string[] = [];

      // Upload new files and keep existing ones
      for (const file of files) {
        const docId = (file as any).documentId;
        if (docId) {
          documentIds.push(docId);
        } else {
          // Upload new file to server
          const uploadRes = await meetingApi.uploadDocument(file, file.name, "AGENDA_ITEM", "Tải lên bởi người chuẩn bị");
          if (uploadRes.success && uploadRes.data?.id) {
            documentIds.push(uploadRes.data.id);
          } else {
            throw new Error(`Không thể tải lên file ${file.name}: ${uploadRes.message || 'Lỗi không xác định'}`);
          }
        }
      }

      // Submit the list of document IDs to the agenda item
      const submitRes = await meetingApi.submitDocs(agendaItemId, documentIds);
      if (submitRes.success) {
        toast.success("Nộp tài liệu thành công", "Tài liệu của bạn đã được gửi đi phê duyệt.");
        // Refresh local data to show updated statuses and documents
        await loadData();
      } else {
        toast.error("Nộp tài liệu thất bại", submitRes.message || "Đã xảy ra lỗi.");
      }
    } catch (error: any) {
      console.error("Error submitting documents:", error);
      toast.error("Lỗi xử lý", error.message || "Đã xảy ra lỗi trong quá trình nộp tài liệu.");
    } finally {
      setSubmitting(prev => ({ ...prev, [agendaItemId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <Loader2 className="h-10 w-10 animate-spin text-[#C8102E] mb-4" />
        <p className="text-gray-600 text-sm font-medium">Đang tải dữ liệu chuẩn bị tài liệu...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto mt-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy thông tin phiên họp</h2>
        <p className="text-sm text-gray-500 mb-6">Liên kết không hợp lệ hoặc bạn không có quyền xem.</p>
        <Button onClick={() => navigate('/phien-hop')} className="bg-[#C8102E] hover:bg-[#A90F14] text-white rounded-xl">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header & Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/phien-hop')}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại quản lý phiên họp
          </button>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Nộp tài liệu chuẩn bị họp
          </h1>
          <p className="text-sm text-gray-500">
            Dành cho người được giao chuẩn bị tài liệu các đầu mục chương trình
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="flex items-center gap-1.5 border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {/* Meeting Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-[#C8102E] text-xs font-semibold rounded-full uppercase tracking-wider">
          Thông tin phiên họp
        </div>
        <h2 className="text-xl font-bold text-gray-900">{meeting.title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 text-sm text-gray-600">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
            <span>
              {format(new Date(meeting.startTime), 'dd/MM/yyyy HH:mm', { locale: vi })} - {format(new Date(meeting.endTime), 'HH:mm', { locale: vi })}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">
              {meeting.locationName || meeting.onlineLink || "Chưa xác định địa điểm"}
            </span>
          </div>
        </div>
      </div>

      {/* Agenda Items List */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileUp className="h-5 w-5 text-[#C8102E]" />
          Đầu mục bạn được giao chuẩn bị ({assignedItems.length})
        </h3>

        {assignedItems.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-2xl p-12 text-center bg-gray-50/50">
            <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Bạn không có đầu mục nào cần chuẩn bị tài liệu</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Vui lòng kiểm tra lại với người tạo cuộc họp nếu có sai sót.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {assignedItems.map((item, index) => {
              const badge = STATUS_BADGES[item.status] || { label: item.status, className: 'bg-gray-100 text-gray-700' };
              const files = agendaFiles[item.id] || [];
              const isSubmitting = submitting[item.id] || false;
              
              // Only allow upload if meeting is draft/rejected or if item status is pending_prep/rejected
              const canUpload = item.status === 'PENDING_PREPARATION' || item.status === 'REJECTED';

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  {/* Item Header */}
                  <div className="bg-gray-50/70 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-50 text-[#C8102E] text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate pr-4 text-base" title={item.title}>
                          {item.title}
                        </h4>
                        {item.prepDeadline && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              Hạn nộp: <span className="font-semibold text-red-600">{format(new Date(item.prepDeadline), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex px-3 py-1 border rounded-full text-xs font-semibold shrink-0 ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Item Content Body */}
                  <div className="p-6 space-y-5">
                    {/* Guidance / Instructions */}
                    {item.content && (
                      <div className="bg-red-50/30 border border-[#C8102E]/10 rounded-xl p-4 space-y-1">
                        <div className="text-xs font-bold text-[#C8102E] uppercase tracking-wider">
                          Yêu cầu từ Người tạo cuộc họp:
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {item.content}
                        </p>
                      </div>
                    )}

                    {/* Reject Reason if rejected */}
                    {item.status === 'REJECTED' && item.rejectReason && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-red-800">
                            Lý do tài liệu bị từ chối phê duyệt:
                          </div>
                          <p className="text-sm text-red-700 whitespace-pre-wrap">
                            {item.rejectReason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* File Uploader */}
                    <div className="space-y-2">
                      <FileUploader
                        files={files}
                        onChange={(updatedFiles) => handleFileChange(item.id, updatedFiles)}
                        multiple={true}
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        allowedExtensionsText="PDF, DOC, DOCX, XLS, XLSX"
                        label="Tài liệu đính kèm chuẩn bị"
                        placeholder="Kéo thả tài liệu nộp"
                      />
                    </div>
                  </div>

                  {/* Item Action Footer */}
                  {canUpload && (
                    <div className="bg-gray-50/30 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                      <Button
                        onClick={() => handleSubmitDocs(item.id)}
                        disabled={isSubmitting || files.length === 0}
                        className="bg-[#C8102E] hover:bg-[#A90F14] text-white rounded-xl flex items-center gap-2 shadow-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang nộp tài liệu...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Gửi tài liệu nộp
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* General Exit Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={() => navigate('/phien-hop')}
          className="border-gray-300 rounded-xl px-8 py-2.5 bg-white text-gray-700 hover:bg-gray-50"
        >
          Thoát trang nộp tài liệu
        </Button>
      </div>
    </div>
  );
}
