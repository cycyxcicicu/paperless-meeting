import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Trash2, CalendarIcon, Send, Check, AlertCircle } from 'lucide-react';
import { FileUploader } from '@/common/components/ui/FileUploader';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from '@/lib/toast';
import { useWebSocket } from '@/app/context/WebSocketContext';
import { Button } from '@/common/components/ui/button';
import { Label } from '@/common/components/ui/label';
import { Input } from '@/common/components/ui/input';
import { Textarea } from '@/common/components/ui/textarea';
import { ScrollDatePicker } from '@/common/components/ui/scroll-date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/common/components/ui/popover';
import { CustomSelect } from '@/common/components/ui/custom-select';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/common/utils/cn';
import { Member } from './SelectUnitModal';
import { Modal } from '@/common/components/ui/modal';
import { meetingApi } from '../services/meeting.api';
import { FeedbackChatSection } from './FeedbackChatSection';

interface BieuQuyetIssue {
  id: string;
  ten: string;
  moTa: string;
}

interface AgendaItemFeedback {
  id: string;
  authorName: string;
  content: string;
  type: 'INSTRUCTION' | 'REJECTION' | 'RESPONSE';
  createdAt: string;
}

interface NoiDungItem {
  id: string;
  noiDungChiTiet: string;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  nguoiChuanBi: string;
  content?: string;
  nguoiDuyet: string;
  taiLieu: any[];
  bieuQuyetIssues: BieuQuyetIssue[];
  thanhPhanThamDu: {
    donVi: Member[];
    khachMoi: any[];
  };
  status?: string;
  rejectReason?: string;
  prepDeadline?: string;
  feedbacks?: AgendaItemFeedback[];
  prepInstructions?: string;
}

interface NoiDungHopData {
  contents: NoiDungItem[];
}

interface ThanhPhanThamDuData {
  donVi: Member[];
  khachMoi: any[];
  chuTriId: string | null;
}

interface NoiDungHopStepProps {
  data: NoiDungHopData;
  onChange: (data: NoiDungHopData) => void;
  singleContentMode: boolean;
  errors?: Record<string, any>;
  inheritedParticipants?: ThanhPhanThamDuData;
  isReadOnly?: boolean;
  isUpdateMode?: boolean;
  meetingId?: string;
  hasProgramInStep1?: boolean;
}



const NoiDungHopStep: React.FC<NoiDungHopStepProps> = ({
  data,
  onChange,
  singleContentMode,
  errors = {},
  inheritedParticipants,
  isUpdateMode,
  meetingId,
  isReadOnly = false,
  hasProgramInStep1 = false,
}) => {
  const { subscribe } = useWebSocket();
  const { user } = useAuth();

  const [activeContentId, setActiveContentId] = useState(data.contents[0]?.id || '');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    agendaId: string;
    reason: string;
  } | null>(null);

  const handleApprove = async (agendaItemId: string) => {
    try {
      const res = await meetingApi.approveDocs(agendaItemId);
      if (res.success) {
        toast.success("Phê duyệt tài liệu thành công");
        const updatedContents = data.contents.map(c => {
          if (c.id === agendaItemId) {
            return {
              ...c,
              status: 'APPROVED',
              feedbacks: res.data?.feedbacks || []
            };
          }
          return c;
        });
        onChange({ contents: updatedContents });
      } else {
        toast.error("Thất bại", res.message || "Không thể phê duyệt tài liệu");
      }
    } catch (error: any) {
      console.error("Error approving docs:", error);
      toast.error("Lỗi kết nối", error.message || "Đã xảy ra lỗi khi phê duyệt.");
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectModal.reason.trim()) {
      toast.error("Yêu cầu nhập lý do từ chối");
      return;
    }

    try {
      const res = await meetingApi.rejectDocs(rejectModal.agendaId, rejectModal.reason.trim());
      if (res.success) {
        toast.success("Đã từ chối tài liệu và gửi lại yêu cầu chỉnh sửa");
        const updatedContents = data.contents.map(c => {
          if (c.id === rejectModal.agendaId) {
            return {
              ...c,
              status: 'REJECTED',
              feedbacks: res.data?.feedbacks || []
            };
          }
          return c;
        });
        onChange({ contents: updatedContents });
      } else {
        toast.error("Thất bại", res.message || "Không thể từ chối tài liệu");
      }
    } catch (error: any) {
      console.error("Error rejecting docs:", error);
      toast.error("Lỗi kết nối", error.message || "Đã xảy ra lỗi.");
    } finally {
      setRejectModal(null);
    }
  };

  const [prepModal, setPrepModal] = useState<{
    isOpen: boolean;
    agendaId: string;
    title: string;
    instructions: string;
    deadline: string;
    preparerName: string;
  } | null>(null);

  const handleOpenPrepModal = (item: NoiDungItem) => {
    const person = participantOptions.find(opt => opt.value === item.nguoiChuanBi);
    const latestInstruction = item.feedbacks?.filter(f => f.type === 'INSTRUCTION')?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    setPrepModal({
      isOpen: true,
      agendaId: item.id,
      title: item.noiDungChiTiet || '',
      instructions: item.prepInstructions || latestInstruction?.content || '',
      deadline: item.prepDeadline || '',
      preparerName: person ? person.label : 'Người chuẩn bị'
    });
  };

  const handleConfirmSendPrepRequest = async () => {
    if (!prepModal || !meetingId) return;

    try {
      const res = await meetingApi.sendPrepRequest(meetingId, prepModal.agendaId, {
        prepDeadline: prepModal.deadline,
        content: prepModal.instructions
      });

      if (res.success) {
        toast.success(
          "Gửi yêu cầu thành công",
          "Yêu cầu chuẩn bị tài liệu đã được gửi tới người chuẩn bị"
        );
        handleUpdateContent(prepModal.agendaId, { 
          status: 'PENDING_PREPARATION',
          prepDeadline: prepModal.deadline,
          prepInstructions: prepModal.instructions,
          feedbacks: res.data?.feedbacks || []
        });
      } else {
        toast.error("Thất bại", res.message || "Không thể gửi yêu cầu");
      }
    } catch (error) {
      console.error("Error sending prep request:", error);
      toast.error("Lỗi hệ thống", "Đã xảy ra lỗi khi gửi yêu cầu chuẩn bị tài liệu.");
    } finally {
      setPrepModal(null);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (isReadOnly) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (isReadOnly || draggedIndex === null || draggedIndex === targetIndex) return;

    const newContents = [...data.contents];
    const [draggedItem] = newContents.splice(draggedIndex, 1);
    newContents.splice(targetIndex, 0, draggedItem);

    onChange({
      ...data,
      contents: newContents,
    });
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Sync activeContentId with contents
  useEffect(() => {
    if (data.contents.length > 0) {
      const exists = data.contents.some(c => c.id === activeContentId);
      if (!activeContentId || !exists) {
        // If the activeContentId was a temp ID like 'content-1', try to keep the same index
        if (activeContentId && activeContentId.startsWith('content-')) {
          const indexStr = activeContentId.replace('content-', '');
          const index = parseInt(indexStr, 10);
          if (!isNaN(index) && data.contents[index]) {
            setActiveContentId(data.contents[index].id);
            return;
          }
        }
        // Fallback to first item
        setActiveContentId(data.contents[0].id);
      }
    } else {
      setActiveContentId('');
    }
  }, [data.contents, activeContentId]);

  useEffect(() => {
    if (!meetingId || data.contents.length === 0) return;

    const unsubscribers = data.contents.map(item => {
      if (!item.id || item.id.startsWith('content-')) return () => {};

      return subscribe(`/topic/meeting/${meetingId}/agenda/${item.id}/chat`, (newFeedbacks: any) => {
        console.log(`Real-time chat update for agenda item ${item.id} (coordinator view):`, newFeedbacks);
        
        const updatedContents = data.contents.map(c => {
          if (c.id === item.id) {
            return {
              ...c,
              feedbacks: newFeedbacks
            };
          }
          return c;
        });
        onChange({ contents: updatedContents });
      });
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe, meetingId, data.contents.map(c => c.id).join(',')]);

  // Sync inherited participants from step 2 to all content items
  useEffect(() => {
    if (inheritedParticipants && data.contents.length > 0) {
      const hasInheritedData =
        inheritedParticipants.donVi.length > 0 ||
        inheritedParticipants.khachMoi.length > 0;

      if (hasInheritedData) {
        const updatedContents = data.contents.map((content) => ({
          ...content,
          thanhPhanThamDu: {
            donVi: inheritedParticipants.donVi,
            khachMoi: inheritedParticipants.khachMoi,
          },
        }));

        onChange({ contents: updatedContents });
      }
    }
  }, [inheritedParticipants]);

  // Build participant options from inherited participants (Step 2)
  const participantOptions = useMemo(() => {
    if (!inheritedParticipants) return [];

    const options: { value: string; label: string }[] = [];

    // Add individuals from "Đơn vị" (members selected from units)
    inheritedParticipants.donVi.forEach((person) => {
      options.push({
        value: person.id,
        label: person.position
          ? `${person.name} - ${person.position}`
          : person.name,
      });
    });

    return options;
  }, [inheritedParticipants]);

  const handleAddContent = () => {
    const newContent: NoiDungItem = {
      id: `content-${Date.now()}`,
      noiDungChiTiet: '',
      thoiGianBatDau: '',
      thoiGianKetThuc: '',
      nguoiChuanBi: '',
      content: '',
      nguoiDuyet: '',
      taiLieu: [],
      bieuQuyetIssues: [],
      thanhPhanThamDu: {
        donVi: [],
        khachMoi: [],
      },
      feedbacks: [],
    };

    onChange({
      contents: [...data.contents, newContent],
    });
    setActiveContentId(newContent.id);
  };

  const handleRemoveContent = (contentId: string) => {
    const filtered = data.contents.filter((c) => c.id !== contentId);
    onChange({ contents: filtered });
    if (activeContentId === contentId && filtered.length > 0) {
      setActiveContentId(filtered[0].id);
    }
  };

  const handleUpdateContent = (contentId: string, updates: Partial<NoiDungItem>) => {
    onChange({
      contents: data.contents.map((c) => (c.id === contentId ? { ...c, ...updates } : c)),
    });
  };

  const handleAddBieuQuyetIssue = (contentId: string) => {
    const content = data.contents.find((c) => c.id === contentId);
    if (!content) return;

    const newIssue: BieuQuyetIssue = {
      id: `issue-${Date.now()}`,
      ten: '',
      moTa: '',
    };

    handleUpdateContent(contentId, {
      bieuQuyetIssues: [...content.bieuQuyetIssues, newIssue],
    });
  };

  const handleRemoveBieuQuyetIssue = (contentId: string, issueId: string) => {
    const content = data.contents.find((c) => c.id === contentId);
    if (!content) return;

    handleUpdateContent(contentId, {
      bieuQuyetIssues: content.bieuQuyetIssues.filter((i) => i.id !== issueId),
    });
  };

  const handleUpdateBieuQuyetIssue = (
    contentId: string,
    issueId: string,
    field: keyof BieuQuyetIssue,
    value: string
  ) => {
    const content = data.contents.find((c) => c.id === contentId);
    if (!content) return;

    const updatedIssues = content.bieuQuyetIssues.map((issue) =>
      issue.id === issueId ? { ...issue, [field]: value } : issue
    );

    handleUpdateContent(contentId, {
      bieuQuyetIssues: updatedIssues,
    });
  };



  const handleRemoveParticipant = (type: 'donVi' | 'khachMoi', id: string) => {
    const content = data.contents.find((c) => c.id === activeContentId);
    if (!content) return;

    const updatedParticipants = {
      ...content.thanhPhanThamDu,
      [type]: content.thanhPhanThamDu[type].filter((item: any) => item.id !== id),
    };

    handleUpdateContent(activeContentId, {
      thanhPhanThamDu: updatedParticipants,
    });
  };

  const activeContent = data.contents.find((c) => c.id === activeContentId);

  return (
    <div>
      {hasProgramInStep1 && (
        <div className="mb-4 flex items-start gap-3 bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-blue-800 animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <span className="text-sm font-semibold block">Thông báo chương trình họp</span>
            <p className="text-xs text-blue-700/90 leading-relaxed">
              Bạn đã cung cấp nội dung chương trình họp ở <strong>Bước 1 (Chi tiết họp)</strong>. Do đó, việc nhập các nội dung chi tiết tại bước này là <strong>không bắt buộc</strong>. Bạn có thể bỏ qua hoặc chỉ nhập các nội dung chi tiết nếu cần thiết.
            </p>
          </div>
        </div>
      )}

      <div className="border border-gray-400 rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-1 px-6">
            {data.contents.map((content, index) => (
              <div
                key={content.id}
                className={cn(
                  'relative group flex items-center select-none',
                  !isReadOnly && 'cursor-move',
                  draggedIndex === index && 'opacity-50 bg-gray-200 border-dashed border border-gray-400 rounded-lg'
                )}
                draggable={!isReadOnly}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <button
                  onClick={() => setActiveContentId(content.id)}
                  className={cn(
                    'relative px-6 py-3 text-sm btn-primary transition-colors',
                    activeContentId === content.id ? 'text-[#C8102E]' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Nội dung {index + 1}
                  {activeContentId === content.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C8102E] to-[#A90F14]" />
                  )}
                </button>
                {!singleContentMode && data.contents.length > 1 && !isReadOnly && (
                  <button
                    onClick={() => handleRemoveContent(content.id)}
                    className="ml-1 p-0.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}

            {!singleContentMode && !isReadOnly && (
              <button
                onClick={handleAddContent}
                className="ml-2 p-2 text-gray-400 hover:text-[#C8102E] hover:bg-red-50 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Form */}
        {activeContent && (
          <div className="p-6 space-y-6 bg-white">
            {/* Header Form: Trạng thái */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Trạng thái chuẩn bị tài liệu:
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                  activeContent.status === 'PENDING_APPROVAL' && "bg-amber-50 text-amber-700 border-amber-200",
                  activeContent.status === 'APPROVED' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                  activeContent.status === 'REJECTED' && "bg-red-50 text-red-700 border-red-200",
                  activeContent.status === 'PENDING_PREPARATION' && "bg-blue-50 text-blue-700 border-blue-200",
                  (!activeContent.status || activeContent.status === 'DRAFT') && "bg-gray-50 text-gray-700 border-gray-200"
                )}>
                  {activeContent.status === 'PENDING_APPROVAL' && 'Chờ phê duyệt'}
                  {activeContent.status === 'APPROVED' && 'Đã phê duyệt'}
                  {activeContent.status === 'REJECTED' && 'Bị từ chối'}
                  {activeContent.status === 'PENDING_PREPARATION' && 'Đang chuẩn bị'}
                  {(!activeContent.status || activeContent.status === 'DRAFT') && 'Bản nháp'}
                </span>
              </div>
            </div>

            {/* Tiêu đề nội dung */}
            <div className="space-y-2">
              <Label htmlFor="noiDungChiTiet" className="text-sm">
                Tiêu đề <span className="text-[#C8102E]">*</span>
              </Label>
              <Input
                id="noiDungChiTiet"
                value={activeContent.noiDungChiTiet}
                onChange={(e) =>
                  handleUpdateContent(activeContentId, { noiDungChiTiet: e.target.value })
                }
                placeholder="Nhập tiêu đề nội dung..."
                className={cn(
                  'rounded-xl border-gray-400 hover:border-gray-500',
                  errors[activeContentId]?.noiDungChiTiet &&
                    'border-red-500 focus-visible:ring-red-500'
                )}
                disabled={isReadOnly}
              />
              {errors[activeContentId]?.noiDungChiTiet && (
                <p className="text-xs text-red-600 body">
                  {errors[activeContentId].noiDungChiTiet}
                </p>
              )}
            </div>

            {/* Nội dung chi tiết */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm">
                Nội dung chi tiết
              </Label>
              <Textarea
                id="content"
                value={activeContent.content || ''}
                onChange={(e) =>
                  handleUpdateContent(activeContentId, { content: e.target.value })
                }
                placeholder="Nhập nội dung chi tiết của phiên họp..."
                rows={3}
                className={cn(
                  'resize-none rounded-xl border-gray-400 hover:border-gray-500'
                )}
                disabled={isReadOnly}
              />
            </div>

            {/* Thời gian */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thoiGianBatDau">Thời gian bắt đầu</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left caption border-gray-400 hover:border-gray-500 rounded-xl font-normal',
                        !activeContent.thoiGianBatDau && 'text-gray-500',
                        errors[activeContentId]?.thoiGianBatDau && 'border-red-500 focus-visible:ring-red-500'
                      )}
                      disabled={isReadOnly}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {activeContent.thoiGianBatDau ? (
                        format(new Date(activeContent.thoiGianBatDau), 'dd/MM/yyyy HH:mm', { locale: vi })
                      ) : (
                        <span>Chọn thời gian bắt đầu</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <ScrollDatePicker
                      value={activeContent.thoiGianBatDau ? new Date(activeContent.thoiGianBatDau) : undefined}
                      onChange={(date) =>
                        handleUpdateContent(activeContentId, { thoiGianBatDau: date.toISOString() })
                      }
                      showTime={true}
                      disablePastDates={true}
                    />
                  </PopoverContent>
                </Popover>
                {errors[activeContentId]?.thoiGianBatDau && (
                  <p className="text-xs text-red-600 body">
                    {errors[activeContentId].thoiGianBatDau}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="thoiGianKetThuc">Thời gian kết thúc</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left caption border-gray-400 hover:border-gray-500 rounded-xl font-normal',
                        !activeContent.thoiGianKetThuc && 'text-gray-500',
                        errors[activeContentId]?.thoiGianKetThuc && 'border-red-500 focus-visible:ring-red-500'
                      )}
                      disabled={isReadOnly}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {activeContent.thoiGianKetThuc ? (
                        format(new Date(activeContent.thoiGianKetThuc), 'dd/MM/yyyy HH:mm', { locale: vi })
                      ) : (
                        <span>Chọn thời gian kết thúc</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <ScrollDatePicker
                      value={activeContent.thoiGianKetThuc ? new Date(activeContent.thoiGianKetThuc) : undefined}
                      onChange={(date) =>
                        handleUpdateContent(activeContentId, { thoiGianKetThuc: date.toISOString() })
                      }
                      showTime={true}
                      disablePastDates={true}
                    />
                  </PopoverContent>
                </Popover>
                {errors[activeContentId]?.thoiGianKetThuc && (
                  <p className="text-xs text-red-600 body">
                    {errors[activeContentId].thoiGianKetThuc}
                  </p>
                )}
              </div>
            </div>

            {/* Người chuẩn bị tài liệu */}
            <div className="space-y-2">
              <Label htmlFor="nguoiChuanBi">Người chuẩn bị tài liệu</Label>
              <CustomSelect
                value={activeContent.nguoiChuanBi}
                onChange={(value) =>
                  handleUpdateContent(activeContentId, { nguoiChuanBi: value })
                }
                options={participantOptions}
                placeholder={
                  participantOptions.length === 0
                    ? 'Vui lòng chọn thành phần tham dự ở bước 2'
                    : 'Chọn người chuẩn bị'
                }
                disabled={participantOptions.length === 0 || isReadOnly}
              />
              {activeContent.nguoiChuanBi && (!activeContent.status || activeContent.status === 'DRAFT') && (
                <div className="space-y-1.5 mt-3">
                  <Label htmlFor="prepInstructions" className="text-sm">
                    Nội dung ghi chú / Hướng dẫn chuẩn bị tài liệu <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="prepInstructions"
                    value={activeContent.prepInstructions || ''}
                    onChange={(e) =>
                      handleUpdateContent(activeContentId, { prepInstructions: e.target.value })
                    }
                    placeholder="Nhập ghi chú yêu cầu chuẩn bị tài liệu gì..."
                    rows={3}
                    disabled={isReadOnly}
                    className={cn(
                      "resize-none rounded-xl border-gray-400 hover:border-gray-500",
                      errors[activeContentId]?.prepInstructions && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {errors[activeContentId]?.prepInstructions && (
                    <p className="text-xs text-red-600 body">
                      {errors[activeContentId].prepInstructions}
                    </p>
                  )}
                </div>
              )}
              {!isReadOnly && activeContent.nguoiChuanBi && (
                <div className="mt-3">
                  {activeContent.id && !activeContent.id.startsWith('content-') ? (
                    <FeedbackChatSection
                      agendaItemId={activeContent.id}
                      feedbacks={activeContent.feedbacks}
                      feedbackType="INSTRUCTION"
                      placeholder="Trả lời / Nhập ý kiến phản hồi hướng dẫn..."
                      onSuccess={(updatedFeedbacks) => {
                        const updatedContents = data.contents.map(c => {
                          if (c.id === activeContent.id) {
                            return {
                              ...c,
                              feedbacks: updatedFeedbacks
                            };
                          }
                          return c;
                        });
                        onChange({ contents: updatedContents });
                      }}
                    />
                  ) : (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                        Lịch sử trao đổi / Ý kiến phản hồi
                      </span>
                      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-100 p-2 rounded-xl">
                        Vui lòng lưu phiên họp trước khi thực hiện trao đổi/phản hồi.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upload tài liệu */}
            <div className="relative">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center w-full h-32 border border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#C8102E] border-r-transparent mb-2"></div>
                  <span className="text-sm text-gray-500 font-medium">Đang tải tài liệu lên...</span>
                </div>
              ) : (
                <FileUploader
                  files={activeContent.taiLieu || []}
                  onChange={async (files) => {
                    const newFiles = files.filter(f => f instanceof File);
                    const existingFiles = files.filter(f => !(f instanceof File));

                    if (newFiles.length > 0) {
                      setIsUploading(true);
                      try {
                        const uploadedList = [];
                        for (const file of newFiles) {
                          const res = await meetingApi.uploadDocument(file, file.name, 'OTHER');
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
                        handleUpdateContent(activeContentId, {
                          taiLieu: [...existingFiles, ...uploadedList]
                        });
                        toast.success("Tải tài liệu lên thành công");
                      } catch (error: any) {
                        console.error("Upload failed", error);
                        toast.error(error?.response?.data?.message || error?.message || "Lỗi khi tải file lên");
                      } finally {
                        setIsUploading(false);
                      }
                    } else {
                      handleUpdateContent(activeContentId, { taiLieu: files });
                    }
                  }}
                  multiple={true}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.zip"
                  allowedExtensionsText="PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG, JPEG, TXT, ZIP"
                  label="Tài liệu đính kèm"
                  disabled={isReadOnly}
                  currentUserId={user?.id}
                />
              )}
            </div>

            {/* Tác vụ duyệt tài liệu trực tiếp dưới phần file */}
            {activeContent.status === 'PENDING_APPROVAL' && !isReadOnly && (
              <div className="flex items-center justify-between gap-4 bg-amber-50/50 border border-amber-200 rounded-xl p-4 animate-in fade-in duration-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Đang chờ phê duyệt tài liệu đã nộp
                  </span>
                  <p className="text-[11px] text-amber-700/80">
                    Vui lòng kiểm tra kỹ các file tài liệu đính kèm bên trên trước khi thực hiện phê duyệt.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    onClick={() => setRejectModal({ isOpen: true, agendaId: activeContent.id, reason: '' })}
                    className="bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-xl text-xs font-semibold py-1.5 px-3.5 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                    Từ chối
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleApprove(activeContent.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-1.5 px-4 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Phê duyệt
                  </Button>
                </div>
              </div>
            )}

            {/* Danh sách vấn đề cần biểu quyết */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Danh sách vấn đề cần biểu quyết</Label>
                {!isReadOnly && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddBieuQuyetIssue(activeContentId)}
                  >
                    <Plus className="h-4 w-4" />
                    Thêm vấn đề mới
                  </Button>
                )}
              </div>

              {activeContent.bieuQuyetIssues.length === 0 ? (
                <div className="border border-gray-400 rounded-xl p-8 text-center">
                  <p className="text-sm text-gray-500">Chưa có vấn đề cần biểu quyết</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeContent.bieuQuyetIssues.map((issue, index) => (
                    <div key={issue.id} className="border border-gray-400 rounded-xl p-4 hover:border-gray-500 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm btn-primary text-gray-700">
                              Vấn đề {index + 1}
                            </span>
                            <Input
                              placeholder="Tên vấn đề cần biểu quyết"
                              value={issue.ten}
                              onChange={(e) =>
                                handleUpdateBieuQuyetIssue(
                                  activeContentId,
                                  issue.id,
                                  'ten',
                                  e.target.value
                                )
                              }
                              className="flex-1 border-gray-400 hover:border-gray-500"
                              disabled={isReadOnly}
                            />
                          </div>
                          <Textarea
                            placeholder="Mô tả chi tiết..."
                            value={issue.moTa}
                            onChange={(e) =>
                              handleUpdateBieuQuyetIssue(
                                activeContentId,
                                issue.id,
                                'moTa',
                                e.target.value
                              )
                            }
                            rows={2}
                            className="resize-none rounded-xl border-gray-400 hover:border-gray-500"
                            disabled={isReadOnly}
                          />
                        </div>
                        {!isReadOnly && (
                          <button
                            onClick={() => handleRemoveBieuQuyetIssue(activeContentId, issue.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {prepModal && (
        <Modal
          isOpen={prepModal.isOpen}
          onClose={() => setPrepModal(null)}
          title="Yêu cầu chuẩn bị tài liệu"
          className="max-w-lg"
        >
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Người nhận</Label>
              <Input value={prepModal.preparerName} disabled className="bg-gray-50 border-gray-300 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>Hạn nộp tài liệu <span className="text-[#C8102E]">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left border-gray-400 hover:border-gray-500 rounded-xl font-normal',
                      !prepModal.deadline && 'text-gray-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {prepModal.deadline ? (
                      format(new Date(prepModal.deadline), 'dd/MM/yyyy HH:mm', { locale: vi })
                    ) : (
                      <span>Chọn hạn nộp</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="start">
                  <ScrollDatePicker
                    value={prepModal.deadline ? new Date(prepModal.deadline) : undefined}
                    onChange={(date) =>
                      setPrepModal(prev => prev ? { ...prev, deadline: date.toISOString() } : null)
                    }
                    showTime={true}
                    disablePastDates={true}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Nội dung ghi chú / Hướng dẫn</Label>
              <Textarea
                value={prepModal.instructions}
                onChange={(e) =>
                  setPrepModal(prev => prev ? { ...prev, instructions: e.target.value } : null)
                }
                placeholder="Nhập nội dung ghi chú giao việc hoặc hướng dẫn chuẩn bị..."
                rows={4}
                className="resize-none rounded-xl border-gray-400 hover:border-gray-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="rounded-xl border-gray-400 hover:border-gray-500" onClick={() => setPrepModal(null)}>
                Đóng
              </Button>
              <Button
                className="bg-[#C8102E] hover:bg-[#A90F14] text-white rounded-xl"
                disabled={!prepModal.deadline}
                onClick={handleConfirmSendPrepRequest}
              >
                Gửi yêu cầu
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {rejectModal && (
        <Modal
          isOpen={rejectModal.isOpen}
          onClose={() => setRejectModal(null)}
          title="Từ chối tài liệu & Yêu cầu chỉnh sửa"
          className="max-w-lg"
        >
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lý do từ chối / Hướng dẫn chỉnh sửa <span className="text-[#C8102E]">*</span></Label>
              <Textarea
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal(prev => prev ? { ...prev, reason: e.target.value } : null)
                }
                placeholder="Nhập lý do từ chối tài liệu và yêu cầu người chuẩn bị bổ sung chỉnh sửa gì..."
                rows={4}
                className="resize-none rounded-xl border-gray-400 hover:border-gray-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="rounded-xl border-gray-400 hover:border-gray-500" onClick={() => setRejectModal(null)}>
                Hủy
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                disabled={!rejectModal.reason.trim()}
                onClick={handleReject}
              >
                Gửi từ chối
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export { NoiDungHopStep };
export type { NoiDungHopData, NoiDungItem };
