import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Label } from '@/common/components/ui/label';
import { RichTextEditor } from './RichTextEditor';
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { createChiTietHopFormSchema } from '../form/meetingForm.schema';
import { FormMode } from '@/common/components/form-engine/form.types';
import { FileUploader } from '@/common/components/ui/FileUploader';

interface ChiTietHopData {
  tenPhienHop: string;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  diaDiem: string;
  linkHopTrucTuyen: string;
  soPhutDenMuon: number;
  noiDungChuongTrinh: 'upload' | 'text';
  noiDungChuongTrinhText: string;
  noiDungChuongTrinhFile?: File | null;
}

interface ChiTietHopStepProps {
  data: ChiTietHopData;
  onChange: (data: ChiTietHopData) => void;
  errors?: Record<string, string>;
}

// Danh sách phòng họp mock
const phongHopList = [
  { id: 'ph1', name: 'Phòng họp A - Tầng 5' },
  { id: 'ph2', name: 'Phòng họp B - Tầng 3' },
  { id: 'ph3', name: 'Phòng họp C - Tầng 4' },
  { id: 'ph4', name: 'Hội trường lớn - Tầng 1' },
  { id: 'ph5', name: 'Hội trường nhỏ - Tầng 2' },
  { id: 'ph6', name: 'Phòng họp VIP - Tầng 6' },
  { id: 'ph7', name: 'Phòng họp D - Tầng 2' },
  { id: 'ph8', name: 'Phòng họp E - Tầng 3' },
];

const phongHopOptions = phongHopList.map((phong) => ({
  value: phong.name,
  label: phong.name,
}));



const ChiTietHopStep: React.FC<ChiTietHopStepProps> = ({ data, onChange, errors = {} }) => {
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
                  onChange={(selectedFiles) => setValue('noiDungChuongTrinhFile', selectedFiles[0] || null)}
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
