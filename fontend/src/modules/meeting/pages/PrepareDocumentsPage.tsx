import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, MapPin, Clock, AlertCircle, CheckCircle2, FileUp, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/app/context/AuthContext';
import { useWebSocket } from '@/app/context/WebSocketContext';
import { TableTooltip } from '@/common/components/table-engine/TableTooltip';
import { meetingApi, MeetingResponse, AgendaItemResponse } from '../services/meeting.api';
import { FileUploader } from '@/common/components/ui/FileUploader';
import { Button } from '@/common/components/ui/button';
import { Textarea } from '@/common/components/ui/textarea';
import { toast } from '@/lib/toast';
import { FeedbackChatSection } from '../components/FeedbackChatSection';

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
  const { subscribe } = useWebSocket();

  const [meeting, setMeeting] = useState<MeetingResponse | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});
  
  // Track files for each agenda item: agendaItemId -> array of uploaded file objects
  const [agendaFiles, setAgendaFiles] = useState<Record<string, any[]>>({});

  const loadData = async (silent = false, showSuccessToast = false) => {
    if (!meetingId) return;
    if (!silent) {
      setLoading(true);
    }
    try {
      const [meetingRes, agendaRes] = await Promise.all([
        meetingApi.getMeetingById(meetingId),
        meetingApi.getAgendaItems(meetingId)
      ]);

      if (meetingRes.success && meetingRes.data) {
        setMeeting(meetingRes.data);
      } else if (!silent || showSuccessToast) {
        toast.error("Lỗi", "Không thể tải thông tin cuộc họp.");
      }

      if (agendaRes.success && agendaRes.data) {
        setAgendaItems(agendaRes.data);

        // Initialize files state for each agenda item
        setAgendaFiles(prev => {
          const updatedFiles = { ...prev };
          const isMeetingActive = meetingRes.data ? (
            meetingRes.data.status === 'UPCOMING' ||
            meetingRes.data.status === 'IN_PROGRESS' ||
            meetingRes.data.status === 'CLOSED'
          ) : false;

          agendaRes.data.forEach(item => {
            let docs = item.documents || [];
            if (!isMeetingActive) {
              // Only see files created by the current user
              docs = docs.filter(doc => doc.createdByUserId === user?.id);
            }

            const serverFiles = docs.map(doc => ({
              id: doc.documentId,
              name: doc.fileName || doc.title || "Tài liệu",
              url: doc.fileUrl,
              size: doc.fileSize || 0,
              createdByUserId: doc.createdByUserId,
              createdByFullName: doc.createdByFullName
            }));

            // Keep locally uploaded/unsaved files that are not yet on the server
            const localFiles = prev[item.id] || [];
            const unsavedLocalFiles = localFiles.filter(lDoc => 
              lDoc && (lDoc instanceof File || !serverFiles.some(sDoc => sDoc.id === lDoc.id))
            );

            updatedFiles[item.id] = [...serverFiles, ...unsavedLocalFiles];
          });
          return updatedFiles;
        });

        if (showSuccessToast && meetingRes.success) {
          toast.success("Làm mới dữ liệu thành công");
        }
      } else if (!silent || showSuccessToast) {
        toast.error("Lỗi", "Không thể tải chương trình họp.");
      }
    } catch (error) {
      console.error("Error loading preparation data:", error);
      if (!silent || showSuccessToast) {
        toast.error("Lỗi kết nối", "Đã xảy ra lỗi khi tải dữ liệu từ máy chủ.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [meetingId]);

  useEffect(() => {
    if (!meetingId) return;

    let debounceTimeout: any = null;

    const unsubscribe = subscribe(`/topic/meeting/${meetingId}`, (message: any) => {
      if (message.action === "REFRESH_MEETING_DETAIL" || message.action === "REFRESH_MEETING_STATUS") {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        debounceTimeout = setTimeout(() => {
          loadData(true);
        }, 300);
      }
    });

    return () => {
      unsubscribe();
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [subscribe, meetingId]);

  useEffect(() => {
    if (!meetingId) return;

    const handlePrivateNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const payload = customEvent.detail;
      if (payload && payload.data && payload.data.meetingId === meetingId) {
        if (payload.type === 'APPROVE_DOCS' || payload.type === 'REJECT_DOCS') {
          console.log('Received private doc status update notification, reloading data...');
          loadData(true);
        }
      }
    };

    window.addEventListener('ws:notification:any', handlePrivateNotification);
    return () => {
      window.removeEventListener('ws:notification:any', handlePrivateNotification);
    };
  }, [meetingId]);

  useEffect(() => {
    if (!meetingId || agendaItems.length === 0) return;

    const unsubscribers = agendaItems.map(item => {
      return subscribe(`/topic/meeting/${meetingId}/agenda/${item.id}/chat`, (newFeedbacks: any) => {
        setAgendaItems(prevItems => prevItems.map(prev => {
          if (prev.id === item.id) {
            return { ...prev, feedbacks: newFeedbacks };
          }
          return prev;
        }));
      });
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe, meetingId, agendaItems.map(item => item.id).join(',')]);

  // Filter agenda items that are assigned to the current user
  const assignedItems = agendaItems.filter(item => item.preparedByUserId === user?.id);

  const handleFileChange = async (agendaItemId: string, files: any[]) => {
    const newFiles = files.filter(f => f instanceof File);
    const existingFiles = files.filter(f => !(f instanceof File));

    if (newFiles.length > 0) {
      setUploadingMap(prev => ({ ...prev, [agendaItemId]: true }));
      try {
        const uploadedList: any[] = [];
        for (const file of newFiles) {
          const res = await meetingApi.uploadDocument(file, file.name, 'AGENDA_ITEM', 'Tải lên bởi người chuẩn bị');
          if (res.success && res.data) {
            const version = (res.data as any).currentVersion;
            uploadedList.push({
              id: res.data.id,
              name: version?.fileName || res.data.title || file.name,
              url: version?.fileUrl || (res.data as any).fileUrl,
              size: version?.fileSize || file.size,
              createdByUserId: user?.id,
              createdByFullName: user?.fullName
            });
          } else {
            toast.error(`Tải file ${file.name} thất bại: ${res.message || ''}`);
          }
        }
        setAgendaFiles(prev => ({
          ...prev,
          [agendaItemId]: [...existingFiles, ...uploadedList]
        }));
        toast.success("Tải tài liệu lên thành công");
      } catch (error: any) {
        console.error("Upload failed", error);
        toast.error(error?.response?.data?.message || error?.message || "Lỗi khi tải file lên");
      } finally {
        setUploadingMap(prev => ({ ...prev, [agendaItemId]: false }));
      }
    } else {
      setAgendaFiles(prev => ({
        ...prev,
        [agendaItemId]: files
      }));
    }
  };

  const handleSubmitDocs = async (agendaItemId: string) => {
    const files = agendaFiles[agendaItemId] || [];
    // Only submit files that belong to the current user (or are newly uploaded by them)
    const myFiles = files.filter(f => !f.createdByUserId || f.createdByUserId === user?.id);
    const documentIds = myFiles.map(f => f.id);

    if (documentIds.length === 0) {
      toast.warning("Chưa có tài liệu", "Vui lòng chọn hoặc kéo thả ít nhất 1 tài liệu để gửi.");
      return;
    }

    setSubmitting(prev => ({ ...prev, [agendaItemId]: true }));
    try {
      const submitRes = await meetingApi.submitDocs(agendaItemId, documentIds);
      if (submitRes.success) {
        toast.success("Nộp tài liệu thành công", "Tài liệu của bạn đã được gửi đi phê duyệt.");
        await loadData(true);
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
          onClick={() => loadData(true, true)}
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
              
              // Only allow upload if status is draft, pending preparation, or rejected
              const canUpload = item.status === 'DRAFT' || item.status === 'PENDING_PREPARATION' || item.status === 'REJECTED';

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  {/* Item Header */}
                  <div className="bg-gray-50/70 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-50 text-[#C8102E] text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <TableTooltip 
                          text={item.title} 
                          maxLength={40} 
                          className="font-bold text-gray-900 truncate pr-4 text-base cursor-pointer block" 
                        />
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
                    {/* Detailed Content */}
                    {item.content && (
                      <div className="space-y-1 bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Nội dung chi tiết mục họp:
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {item.content}
                        </p>
                      </div>
                    )}

                    <FeedbackChatSection
                      agendaItemId={item.id}
                      feedbacks={item.feedbacks}
                      feedbackType="RESPONSE"
                      placeholder="Nhập ý kiến phản hồi hoặc câu hỏi của bạn..."
                      onSuccess={(updatedFeedbacks) => {
                        setAgendaItems(prevItems => prevItems.map(prev => {
                          if (prev.id === item.id) {
                            return { ...prev, feedbacks: updatedFeedbacks };
                          }
                          return prev;
                        }));
                      }}
                    />

                    {/* File Uploader */}
                    <div className="space-y-2 relative">
                      {uploadingMap[item.id] ? (
                        <div className="flex flex-col items-center justify-center w-full h-32 border border-gray-200 rounded-2xl bg-gray-50/50">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#C8102E] border-r-transparent mb-2"></div>
                          <span className="text-sm text-gray-500 font-medium">Đang tải tài liệu lên...</span>
                        </div>
                      ) : (
                        <FileUploader
                          files={files}
                          onChange={(updatedFiles) => handleFileChange(item.id, updatedFiles)}
                          multiple={true}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                          allowedExtensionsText="PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT"
                          label="Tài liệu đính kèm chuẩn bị"
                          placeholder="Kéo thả tài liệu nộp"
                          disabled={!canUpload}
                          currentUserId={user?.id}
                        />
                      )}
                    </div>

                  </div>

                  {/* Item Action Footer */}
                  <div className="bg-gray-50/30 px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    {canUpload ? (
                      <>
                        <p className="text-xs text-gray-500 italic">
                          * Vui lòng tải tài liệu lên và nhấn "Nộp tài liệu" để gửi phê duyệt.
                        </p>
                        <Button
                          onClick={() => handleSubmitDocs(item.id)}
                          disabled={isSubmitting || !files.some(f => !f.createdByUserId || f.createdByUserId === user?.id)}
                          className="bg-[#C8102E] hover:bg-[#A90F14] text-white rounded-xl flex items-center gap-2 shadow-sm font-semibold px-5"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang nộp...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Nộp tài liệu
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between text-xs font-medium">
                        {item.status === 'PENDING_APPROVAL' && (
                          <span className="text-amber-600 flex items-center gap-1.5">
                            <Clock className="h-4 w-4 animate-pulse" />
                            Tài liệu đã nộp, đang chờ phê duyệt. Bạn không thể chỉnh sửa lúc này.
                          </span>
                        )}
                        {item.status === 'APPROVED' && (
                          <span className="text-emerald-600 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            Tài liệu đã được phê duyệt và khóa chỉnh sửa.
                          </span>
                        )}
                        {item.status === 'DRAFT' && (
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4" />
                            Mục họp đang ở trạng thái bản nháp. Chưa yêu cầu chuẩn bị tài liệu.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
