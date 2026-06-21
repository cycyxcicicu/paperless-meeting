import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Eye, X, Users, FileText } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { createThongBaoGiayMoiFormSchema } from '../form/meetingForm.schema';
import { FormFieldGroup } from '@/common/components/form-engine/form.types';
import { ThanhPhanThamDuData } from './ThanhPhanThamDuStep';
import { cn } from '@/common/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';
import { thongBaoGiayMoiSchema } from '../form/meeting.validation';
import { templateApi, DocTemplateResponse } from '../services/template.api';
import { Label } from '@/common/components/ui/label';
import { toast } from '@/lib/toast';
import { useAuth } from '@/app/context/AuthContext';
import { meetingApi, MeetingInvitationPreviewResponse } from '../services/meeting.api';

export interface ThongBaoGiayMoiData {
  coGiayMoi?: boolean;
  mauGiayMoi?: string;
  invitationTemplateId?: string;
  tieuDe?: string;
  noiDung?: string;
  trangThaiKy?: string;
}

interface ThongBaoGiayMoiStepProps {
  meetingId?: string;
  data: ThongBaoGiayMoiData;
  onChange: (data: ThongBaoGiayMoiData) => void;
  thanhPhanData?: ThanhPhanThamDuData;
  chiTietData?: any;
  errors?: Record<string, string>;
  isReadOnly?: boolean;
}



const ThongBaoGiayMoiStep: React.FC<ThongBaoGiayMoiStepProps> = ({ meetingId, data, onChange, thanhPhanData, chiTietData, errors, isReadOnly = false }) => {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<MeetingInvitationPreviewResponse | null>(null);
  const [templates, setTemplates] = useState<DocTemplateResponse[]>([]);
  const [templateOptions, setTemplateOptions] = useState<{ value: string; label: string }[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);

  const methods = useForm<ThongBaoGiayMoiData>({
    resolver: zodResolver(thongBaoGiayMoiSchema),
    defaultValues: {
      coGiayMoi: data.coGiayMoi !== undefined ? data.coGiayMoi : true,
      mauGiayMoi: data.mauGiayMoi || '',
      invitationTemplateId: data.invitationTemplateId || '',
      tieuDe: data.tieuDe || '',
      noiDung: data.noiDung || '',
    },
    mode: 'onChange',
  });

  const { watch, setValue } = methods;
  const formData = watch();
  const coGiayMoi = watch('coGiayMoi');

  // Tải danh sách mẫu thư mời từ API
  React.useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await templateApi.list();
        if (res.success && res.data) {
          // Chỉ lấy các template hoạt động (ACTIVE) và loại INVITATION
          const activeTemplates = res.data.filter(
            t => t.status === 'ACTIVE' && t.templateType === 'INVITATION'
          );
          setTemplates(activeTemplates);
          setTemplateOptions(
            activeTemplates.map(t => ({
              value: t.code,
              label: t.name,
            }))
          );
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách mẫu thư mời:', err);
      }
    };
    fetchTemplates();
  }, []);

  // Tự động điền dữ liệu tiêu đề và nội dung khi chọn mẫu giấy mời mới (tránh ghi đè khi mount)
  const selectedTemplateCode = watch('mauGiayMoi');
  const lastSelectedCodeRef = React.useRef(data.mauGiayMoi);

  React.useEffect(() => {
    if (templates.length > 0 && data.invitationTemplateId && !selectedTemplateCode) {
      const match = templates.find(t => t.id === data.invitationTemplateId);
      if (match) {
        setValue('mauGiayMoi', match.code);
        lastSelectedCodeRef.current = match.code;
      }
    }
  }, [templates, data.invitationTemplateId, setValue, selectedTemplateCode]);

  React.useEffect(() => {
    if (selectedTemplateCode !== lastSelectedCodeRef.current) {
      lastSelectedCodeRef.current = selectedTemplateCode;
      if (selectedTemplateCode && templates.length > 0) {
        const selectedTpl = templates.find(t => t.code === selectedTemplateCode);
        if (selectedTpl) {
          setValue('invitationTemplateId', selectedTpl.id, { shouldValidate: true });
          try {
            const content = JSON.parse(selectedTpl.contentJson);
            if (content.tieuDe) {
              setValue('tieuDe', content.tieuDe, { shouldValidate: true });
            }
            // Do NOT overwrite user's custom content with the template's HTML layout.
            // The template's layout will be compiled in the preview and backend PDF generator instead.
          } catch (e) {
            console.error('Lỗi phân tích cú pháp contentJson của template:', e);
          }
        }
      } else {
        setValue('invitationTemplateId', '', { shouldValidate: true });
      }
    }
  }, [selectedTemplateCode, templates, setValue]);

  React.useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  React.useEffect(() => {
    methods.clearErrors();
    if (errors && Object.keys(errors).length > 0) {
      Object.keys(errors).forEach(key => {
        methods.setError(key as any, { type: 'manual', message: errors[key] });
      });
    }
  }, [errors, methods]);

  const fetchAttendees = async () => {
    if (!meetingId) {
      // Fallback to local members from thanhPhanData if meetingId is not yet available
      const parts = (thanhPhanData?.donVi || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        unit: p.unit || '',
        position: p.position || '',
        type: 'USER'
      }));
      const guests = (thanhPhanData?.khachMoi || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        unit: g.unit || '',
        position: g.position || '',
        type: 'GUEST'
      }));
      const combined = [...parts, ...guests];
      setAllMembers(combined);
      if (combined.length > 0) {
        setSelectedMember(combined[0]);
      }
      return;
    }
    try {
      const res = await meetingApi.getAttendees(meetingId);
      if (res.success && res.data) {
        const parts = (res.data.participants || []).map((p: any) => ({
          id: p.userId,
          name: p.fullName + (p.substitutedForUserName ? ` (Đi thay cho: ${p.substitutedForUserName})` : ''),
          unit: p.deptName || '',
          position: p.positionName || '',
          type: 'USER'
        }));
        const guests = (res.data.guests || []).map((g: any) => ({
          id: g.guestId,
          name: g.fullName + (g.substitutedForUserName ? ` (Đi thay cho: ${g.substitutedForUserName})` : ''),
          unit: g.company || '',
          position: g.position || '',
          type: 'GUEST'
        }));
        const combined = [...parts, ...guests];
        setAllMembers(combined);
        if (combined.length > 0) {
          setSelectedMember(combined[0]);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách người tham gia:', err);
    }
  };

  const handlePreviewClick = async () => {
    const isValid = await methods.trigger(['mauGiayMoi', 'noiDung']);
    if (isValid) {
      setShowPreview(true);
      fetchAttendees();
    } else {
      toast.error('Vui lòng chọn mẫu giấy mời và nhập đầy đủ nội dung trước khi xem.');
    }
  };

  React.useEffect(() => {
    if (!showPreview || !meetingId || !selectedTemplateCode) return;
    
    const selectedTpl = templates.find(t => t.code === selectedTemplateCode);
    if (!selectedTpl) return;

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const payload = {
          invitationTemplateId: selectedTpl.id,
          invitationContent: formData.noiDung || '',
          inviteeId: selectedMember?.id || undefined,
          inviteeType: selectedMember?.type || undefined
        };
        const res = await meetingApi.previewInvitation(meetingId, payload);
        if (res.success && res.data) {
          setPreviewContent(res.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải bản xem trước thư mời:', err);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    loadPreview();
  }, [showPreview, meetingId, selectedTemplateCode, selectedMember, formData.noiDung, templates]);

  const handleExportPreviewPdf = async () => {
    if (!meetingId || !selectedTemplateCode) {
      toast.error('Thiếu thông tin cuộc họp hoặc mẫu thư mời.');
      return;
    }

    const selectedTpl = templates.find(t => t.code === selectedTemplateCode);
    if (!selectedTpl) {
      toast.error('Không tìm thấy dữ liệu mẫu giấy mời.');
      return;
    }
    
    setExportingPdf(true);
    toast.info('Đang xử lý...', 'Hệ thống đang tải xuống thư mời dưới dạng PDF.');
    
    try {
      const payload = {
        invitationTemplateId: selectedTpl.id,
        invitationContent: formData.noiDung || '',
        inviteeId: selectedMember?.id || undefined,
        inviteeType: selectedMember?.type || undefined
      };

      const blob = await meetingApi.exportInvitationPdf(meetingId, payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Giay_Moi_${(selectedMember?.name || 'Dai_Bieu').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Thành công', 'Tải file PDF giấy mời thành công');
    } catch (e: any) {
      toast.error('Lỗi xuất PDF', e.message || 'Không thể tạo file PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const compileText = (text: string) => {
    if (!text) return '';
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());

    let timeStr = '[Thời gian cuộc họp]';
    if (chiTietData?.thoiGianBatDau) {
      const start = new Date(chiTietData.thoiGianBatDau);
      if (!isNaN(start.getTime())) {
        const d = String(start.getDate()).padStart(2, '0');
        const m = String(start.getMonth() + 1).padStart(2, '0');
        const y = start.getFullYear();
        const h = String(start.getHours()).padStart(2, '0');
        const min = String(start.getMinutes()).padStart(2, '0');
        timeStr = `vào lúc ${h} giờ ${min} phút, ngày ${d} tháng ${m} năm ${y}`;
      }
    }

    const orgName = user?.department?.parentName || user?.department?.deptName || 'ỦY BAN NHÂN DÂN THÀNH PHỐ HẢI PHÒNG';
    const deptName = user?.department?.deptName || 'PHÒNG NỘI VỤ';
    const signerName = chiTietData?.chuKyKy || user?.fullName || 'Nguyễn Văn B';
    const signerPosition = user?.position?.positionName || 'CHỦ TỊCH HỘI ĐỒNG';

    const replacements: Record<string, string> = {
      organizationName: orgName,
      departmentName: deptName,
      locationName: 'Hải Phòng',
      day: day,
      month: month,
      year: year,
      receiverName: selectedMember?.name || '[Tên đại biểu]',
      receiverPosition: selectedMember?.position || '[Chức vụ]',
      receiverDepartment: selectedMember?.unit || '[Đơn vị]',
      meetingName: chiTietData?.tenPhienHop || '[Tên phiên họp]',
      meetingTime: timeStr,
      meetingLocation: chiTietData?.phongHopLabel || '[Địa điểm cuộc họp]',
      meetingContent: chiTietData?.noiDungChuongTrinh === 'text' ? (chiTietData?.noiDungChuongTrinhText || '').replace(/\n/g, '<br/>') : 'Xem tài liệu chương trình kèm theo',
      invitationContent: (formData.noiDung || '').replace(/\n/g, '<br/>'),
      signerName: signerName,
      signerPosition: signerPosition,
      docNumber: '.... /GM-UBND'
    };

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return replacements[key] !== undefined ? replacements[key] : match;
    });
  };

  const selectedTpl = templates.find(t => t.code === selectedTemplateCode);
  let tplContent: any = null;
  if (selectedTpl) {
    try {
      tplContent = JSON.parse(selectedTpl.contentJson);
    } catch (e) {
      console.error(e);
    }
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());

  return (
    <div className="space-y-6">
      {/* Form Input Container */}
      <div className="w-full p-6 bg-white rounded-2xl border border-gray-200">
        <FormProvider {...methods}>
          <form className="space-y-6">
            {/* Chọn Có/Không cần giấy mời */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-gray-700">Yêu cầu giấy mời họp</Label>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={coGiayMoi === false}
                    onChange={() => {
                      if (!isReadOnly) {
                        setValue('coGiayMoi', false, { shouldValidate: true });
                        methods.clearErrors();
                      }
                    }}
                    className="w-4 h-4 text-[#C8102E] border-gray-300 focus:ring-[#C8102E]"
                    disabled={isReadOnly}
                  />
                  <span className="text-sm text-gray-700 font-medium">Không cần giấy mời</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={coGiayMoi === true}
                    onChange={() => {
                      if (!isReadOnly) {
                        setValue('coGiayMoi', true, { shouldValidate: true });
                      }
                    }}
                    className="w-4 h-4 text-[#C8102E] border-gray-300 focus:ring-[#C8102E]"
                    disabled={isReadOnly}
                  />
                  <span className="text-sm text-gray-700 font-medium">Có cần giấy mời</span>
                </label>
              </div>
            </div>

            {coGiayMoi === true && (
              <DynamicFormRenderer groups={createThongBaoGiayMoiFormSchema(templateOptions)} mode={isReadOnly ? 'view' : 'create'} />
            )}
          </form>
        </FormProvider>

        {coGiayMoi === true && (
          <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePreviewClick}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Xem mẫu giấy mời
            </Button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Xem trước mẫu giấy mời</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Participants List */}
              <div className="w-1/3 border-r border-gray-200 bg-gray-50/30 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-1">
                    <Users className="h-4 w-4" />
                    <span>Thành viên đã chọn</span>
                  </div>
                  <p className="text-xs text-gray-500">{allMembers.length} người nhận</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {allMembers.length === 0 ? (
                    <div className="text-center p-8 text-gray-500 text-sm">
                      Chưa có thành viên nào được chọn ở Bước 2.
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {allMembers.map((member: any) => (
                        <li key={member.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedMember(member)}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl transition-colors text-sm",
                              selectedMember?.id === member.id
                                ? "bg-red-50 text-[#C8102E] border border-red-200 shadow-sm font-semibold"
                                : "hover:bg-gray-100 text-gray-700 border border-transparent"
                            )}
                          >
                            <div>{member.name}</div>
                            <div className="text-xs mt-1 opacity-80 font-normal line-clamp-1">{member.unit} - {member.position}</div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right Column: Invitation Preview */}
              <div className="flex-1 overflow-y-auto bg-gray-200/50 p-8 flex justify-center items-start relative">
                {isLoadingPreview && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8102E]"></div>
                  </div>
                )}
                {tplContent ? (
                  <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg border border-gray-300 p-16 relative"
                       style={{ fontFamily: 'Times New Roman, Times, serif', boxSizing: 'border-box' }}>
                    
                    {/* Header line */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-[35%] text-center text-sm leading-tight font-bold">
                        {(previewContent?.headerTrai ?? compileText(tplContent.headerTrai || '')).split('\n').map((line: string, idx: number) => {
                          return (
                            <div key={idx}>
                              {line}
                            </div>
                          );
                        })}
                      </div>
                      <div className="w-[65%] text-center text-sm font-bold whitespace-pre-wrap leading-tight">
                        {previewContent?.headerPhai ?? compileText(tplContent.headerPhai || '')}
                      </div>
                    </div>

                    {/* Date/Location */}
                    <div className="text-right italic text-[13px] mb-8 pr-12">
                      {previewContent?.ngayThang ?? compileText(tplContent.ngayThang || '')}
                    </div>

                    {/* Title & trich yeu */}
                    <div className="text-center mb-8">
                      <h1 className="text-xl font-bold uppercase">{previewContent?.tieuDe ?? compileText(tplContent.tieuDe || '')}</h1>
                      {(previewContent?.trichYeu || tplContent.trichYeu) && (
                        <div className="text-[15px] font-normal mt-1 text-gray-800">
                          {previewContent?.trichYeu ?? compileText(tplContent.trichYeu || '')}
                        </div>
                      )}
                    </div>

                    {/* Content area */}
                    <div 
                      className="text-[14px] mb-12 leading-relaxed text-justify px-0 py-0" 
                      dangerouslySetInnerHTML={{ __html: previewContent?.noiDung ?? compileText(tplContent.noiDung || '') }}
                    />

                    {/* Signature Area */}
                    <div className="flex justify-between mt-12 relative">
                      <div className="w-1/2" />
                      <div className="w-1/2 text-center relative">
                        <div className="text-[14px] font-bold uppercase whitespace-pre-wrap mb-[80px]">
                          {(previewContent?.chuKy ?? compileText(tplContent.chuKy || '')).split('\n\n\n\n')[0] || ''}
                        </div>
                        {formData.trangThaiKy === 'co-ky' && (
                          <div className="absolute opacity-85 pointer-events-none left-1/2 -translate-x-1/2 -translate-y-16">
                            {/* Fake Digital Signature Badge */}
                            <div className="border-2 border-red-600 rounded text-red-600 p-2 transform -rotate-12 bg-white/95">
                              <p className="font-bold text-xs">ĐÃ KÝ ĐIỆN TỬ</p>
                              <p className="text-[10px]">Hệ thống Paperless</p>
                              <p className="text-[10px]">{day}/{month}/{year} {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}</p>
                            </div>
                          </div>
                        )}
                        <div className="text-[14px] font-bold whitespace-pre-wrap">
                          {(previewContent?.chuKy ?? compileText(tplContent.chuKy || '')).split('\n\n\n\n')[1] || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg border border-gray-300 p-16 relative">
                    {/* Fallback to simple preview */}
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold uppercase mb-2">{formData.tieuDe || 'GIẤY MỜI HỌP'}</h1>
                    </div>
                    <div 
                      className="text-[15px] leading-relaxed mb-16 text-justify"
                      dangerouslySetInnerHTML={{ __html: (formData.noiDung || '').replace(/\n/g, '<br/>') }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-2">
              <Button 
                variant="danger" 
                onClick={handleExportPreviewPdf}
                disabled={exportingPdf}
              >
                {exportingPdf ? 'Đang xuất...' : 'Xuất PDF'}
              </Button>
              <Button variant="primary" onClick={() => setShowPreview(false)}>
                Đóng xem trước
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ThongBaoGiayMoiStep };
