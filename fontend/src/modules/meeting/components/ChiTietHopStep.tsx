import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Label } from '@/common/components/ui/label';
import { RichTextEditor } from './RichTextEditor';
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { createChiTietHopFormSchema } from '../form/meetingForm.schema';
import { FormMode } from '@/common/components/form-engine/form.types';
import { FileUploader } from '@/common/components/ui/FileUploader';
import { locationApi } from '@/modules/meeting-rooms/services/location.api';
import { meetingApi } from '../services/meeting.api';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/error';

interface ChiTietHopData {
  tenPhienHop: string;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  diaDiem: string;
  linkHopTrucTuyen: string;
  soPhutDenMuon: number;
  noiDungChuongTrinh: 'upload' | 'text';
  noiDungChuongTrinhText: string;
  noiDungChuongTrinhFile?: any | null;
}

interface ChiTietHopStepProps {
  data: ChiTietHopData;
  onChange: (data: ChiTietHopData) => void;
  errors?: Record<string, string>;
}

const ChiTietHopStep: React.FC<ChiTietHopStepProps> = ({ data, onChange, errors = {} }) => {
  const [phongHopOptions, setPhongHopOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    locationApi.getLocations({ isActive: true, size: 100 })
      .then((res) => {
        if (res.success && res.data?.content) {
          const opts = res.data.content.map((phong: any) => ({
            value: phong.id,
            label: `${phong.name} (Sức chứa: ${phong.capacity || 0})`,
          }));
          setPhongHopOptions(opts);
        }
      })
      .catch((err) => {
        console.error('Failed to load locations', err);
      });
  }, []);

  const methods = useForm<ChiTietHopData>({
    defaultValues: data,
    mode: 'onChange'
  });

  const { watch, setValue } = methods;

  // Đồng bộ lên component cha khi có thay đổi
  useEffect(() => {
    const subscription = watch((value) => {
      onChange(value as ChiTietHopData);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  // Cập nhật errors từ parent validation
  useEffect(() => {
    methods.clearErrors();
    Object.keys(errors).forEach((key) => {
      methods.setError(key as keyof ChiTietHopData, { type: 'manual', message: errors[key] });
    });
  }, [errors, methods]);



  const noiDungChuongTrinh = watch('noiDungChuongTrinh');
  const noiDungChuongTrinhText = watch('noiDungChuongTrinhText');
  const noiDungChuongTrinhFile = watch('noiDungChuongTrinhFile');


  return (
    <FormProvider {...methods}>
      <form className="grid grid-cols-[58%_42%] gap-6">
        {/* LEFT COLUMN: Thông tin chính */}
        <div className="space-y-4">
          <DynamicFormRenderer groups={createChiTietHopFormSchema(phongHopOptions)} mode="update" />
        </div>

        {/* RIGHT COLUMN: Nội dung chương trình họp */}
        <div className="space-y-4">
          <div className="space-y-2.5">
            <Label className="text-sm">Nội dung chương trình họp</Label>
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="upload"
                  checked={noiDungChuongTrinh === 'upload'}
                  onChange={() => setValue('noiDungChuongTrinh', 'upload')}
                  className="w-4 h-4 text-[#C8102E] border-gray-300 focus:ring-[#C8102E]"
                />
                <span className="text-sm text-gray-700 body">Tải tài liệu</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="text"
                  checked={noiDungChuongTrinh === 'text'}
                  onChange={() => setValue('noiDungChuongTrinh', 'text')}
                  className="w-4 h-4 text-[#C8102E] border-gray-300 focus:ring-[#C8102E]"
                />
                <span className="text-sm text-gray-700 body">Nhập văn bản</span>
              </label>
            </div>

            {noiDungChuongTrinh === 'text' ? (
              <div className="mt-2">
                <RichTextEditor
                  value={noiDungChuongTrinhText || ''}
                  onChange={(value) => setValue('noiDungChuongTrinhText', value)}
                  placeholder="Nhập nội dung chương trình họp..."
                  minHeight="340px"
                />
              </div>
            ) : (
              <div className="mt-2">
                <FileUploader
                  files={noiDungChuongTrinhFile ? [noiDungChuongTrinhFile] : []}
                  onChange={async (selectedFiles) => {
                    const file = selectedFiles[0];
                    if (file) {
                      try {
                        toast.info("Đang tải tài liệu chương trình họp lên...");
                        const res = await meetingApi.uploadDocument(file, file.name, 'AGENDA', 'Tài liệu chương trình họp');
                        if (res.success && res.data) {
                          setValue('noiDungChuongTrinhFile', {
                            id: res.data.id,
                            name: res.data.fileName || res.data.title,
                            url: res.data.fileUrl
                          });
                          toast.success("Tải tài liệu lên thành công");
                        } else {
                          toast.error(res.message || "Tải tài liệu lên thất bại");
                        }
                      } catch (err: any) {
                        console.error(err);
                        const msg = getErrorMessage(err, "Lỗi khi tải tài liệu lên hệ thống");
                        toast.error(msg);
                      }
                    } else {
                      setValue('noiDungChuongTrinhFile', null);
                    }
                  }}
                  multiple={false}
                  accept=".pdf,.doc,.docx"
                  allowedExtensionsText="PDF, DOC, DOCX"
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export { ChiTietHopStep };
export type { ChiTietHopData };
