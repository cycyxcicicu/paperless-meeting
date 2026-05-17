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

export interface ThongBaoGiayMoiData {
  mauGiayMoi?: string;
  tieuDe?: string;
  noiDung?: string;
  trangThaiKy?: string;
}

interface ThongBaoGiayMoiStepProps {
  data: ThongBaoGiayMoiData;
  onChange: (data: ThongBaoGiayMoiData) => void;
  thanhPhanData?: ThanhPhanThamDuData;
  errors?: Record<string, string>;
}



const ThongBaoGiayMoiStep: React.FC<ThongBaoGiayMoiStepProps> = ({ data, onChange, thanhPhanData, errors }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const methods = useForm<ThongBaoGiayMoiData>({
    resolver: zodResolver(thongBaoGiayMoiSchema),
    defaultValues: data,
    mode: 'onChange',
  });

  const { watch, setValue } = methods;
  const formData = watch();

  React.useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  React.useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      Object.keys(errors).forEach(key => {
        methods.setError(key as any, { type: 'manual', message: errors[key] });
      });
    } else {
      methods.clearErrors();
    }
  }, [errors, methods]);

  // Gom tất cả thành viên (đơn vị và khách mời) để hiển thị trong preview
  const allMembers = [
    ...(thanhPhanData?.donVi || []),
    ...(thanhPhanData?.khachMoi || []),
  ];

  const selectedMember = selectedMemberId ? allMembers.find(m => m.id === selectedMemberId) : allMembers[0];

  return (
    <div className="space-y-6">
      {/* Form Input Container */}
      <div className="w-full p-6 bg-white rounded-2xl border border-gray-200">
        <FormProvider {...methods}>
          <form className="space-y-6">
            <DynamicFormRenderer groups={createThongBaoGiayMoiFormSchema()} mode="create" />
          </form>
        </FormProvider>

        <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPreview(true)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Xem mẫu giấy mời
          </Button>
        </div>
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
                            onClick={() => setSelectedMemberId(member.id)}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl transition-colors text-sm",
                              (selectedMemberId === member.id || (!selectedMemberId && selectedMember?.id === member.id))
                                ? "bg-red-50 text-[#C8102E] border border-red-200 shadow-sm"
                                : "hover:bg-gray-100 text-gray-700 border border-transparent"
                            )}
                          >
                            <div className="font-semibold">{member.name}</div>
                            <div className="text-xs mt-1 opacity-80 line-clamp-1">{member.unit} - {member.position}</div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right Column: Invitation Preview */}
              <div className="flex-1 overflow-y-auto bg-gray-200/50 p-8 flex justify-center items-start">
                <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg border border-gray-300 p-16 relative">
                  {/* Fake Header/Quốc hiệu */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="text-center max-w-[250px]">
                      <p className="font-bold uppercase text-[13px] leading-snug">ỦY BAN NHÂN DÂN</p>
                      <p className="font-bold text-[13px] leading-snug border-b border-black pb-1 mb-1">THÀNH PHỐ HẢI PHÒNG</p>
                      <p className="text-[13px]">Số: .... /GM-UBND</p>
                    </div>
                    <div className="text-center max-w-[300px]">
                      <p className="font-bold uppercase text-[13px] leading-snug">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                      <p className="font-bold text-[13px] leading-snug border-b border-black pb-1 mb-1">Độc lập - Tự do - Hạnh phúc</p>
                      <p className="text-[13px] italic">Hải Phòng, ngày .... tháng .... năm 2026</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold uppercase mb-2">{formData.tieuDe}</h1>
                    <p className="text-sm italic">({formData.mauGiayMoi})</p>
                  </div>

                  {/* Kính gửi mặc định thay vì lấy từ form */}
                  <div className="mb-6">
                    <p className="text-[15px]">
                      <span className="font-bold italic">Kính gửi: </span> 
                      <span className="font-bold">Đồng chí {selectedMember?.name || '[Tên đại biểu]'}</span>
                    </p>
                  </div>

                  {/* Nội dung */}
                  <div className="text-[15px] leading-relaxed mb-16 whitespace-pre-wrap text-justify">
                    {formData.noiDung}
                  </div>

                  {/* Signature Area */}
                  <div className="flex justify-end text-center">
                    <div className="w-[250px]">
                      <p className="font-bold uppercase mb-16 text-[15px]">KT. CHỦ TỊCH</p>
                      
                      {formData.trangThaiKy === 'co-ky' && (
                        <div className="absolute opacity-80 pointer-events-none transform -translate-y-16 translate-x-12">
                          {/* Fake Digital Signature Badge */}
                          <div className="border-2 border-red-600 rounded text-red-600 p-2 transform -rotate-12 bg-white/90">
                            <p className="font-bold text-xs">ĐÃ KÝ ĐIỆN TỬ</p>
                            <p className="text-[10px]">Hệ thống Paperless</p>
                            <p className="text-[10px]">17/05/2026 08:30</p>
                          </div>
                        </div>
                      )}
                      
                      <p className="font-bold text-[15px]">Nguyễn Văn A</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
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
