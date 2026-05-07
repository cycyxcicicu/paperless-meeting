import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Upload, FileText } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { RichTextEditor } from './RichTextEditor';
import { CustomSelect } from '../ui/custom-select';
import { DateTimePicker } from '../ui/datetime-picker';
import { cn } from '../../../lib/utils';

interface ChiTietHopData {
  tenPhienHop: string;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  diaDiem: string;
  noiDungChuongTrinh: 'upload' | 'text';
  noiDungChuongTrinhText: string;
  giayMoiFile: File | null;
  loaiPhienHop: string;
  linkHopTrucTuyen: string;
}

interface ChiTietHopStepProps {
  data: ChiTietHopData;
  onChange: (data: ChiTietHopData) => void;
  errors?: Record<string, string>;
}

const ChiTietHopStep: React.FC<ChiTietHopStepProps> = ({ data, onChange, errors = {} }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleChange = (field: keyof ChiTietHopData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Danh sách phòng họp
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

  const loaiPhienHopOptions = [
    { value: 'thuong-ky', label: 'Thường kỳ' },
    { value: 'bat-thuong', label: 'Bất thường' },
    { value: 'gap', label: 'Gấp' },
  ];

  return (
    <div className="grid grid-cols-[58%_42%] gap-6">
      {/* LEFT COLUMN: Thông tin chính */}
      <div className="space-y-4">
        {/* Tên phiên họp */}
        <div className="space-y-1.5">
          <Label htmlFor="tenPhienHop" required className="text-sm">
            Tên phiên họp
          </Label>
          <Textarea
            id="tenPhienHop"
            value={data.tenPhienHop}
            onChange={(e) => handleChange('tenPhienHop', e.target.value)}
            placeholder="Nhập tên phiên họp"
            rows={2}
            className={cn(
              'resize-none rounded-xl border-gray-400 hover:border-gray-500',
              errors.tenPhienHop && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          {errors.tenPhienHop && (
            <p className="text-xs text-red-600 font-medium mt-1">{errors.tenPhienHop}</p>
          )}
        </div>

        {/* Thời gian */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="thoiGianBatDau" required className="text-sm">
              Thời gian bắt đầu
            </Label>
            <DateTimePicker
              value={data.thoiGianBatDau}
              onChange={(value) => handleChange('thoiGianBatDau', value)}
              placeholder="Chọn thời gian bắt đầu"
              error={!!errors.thoiGianBatDau}
            />
            {errors.thoiGianBatDau && (
              <p className="text-xs text-red-600 font-medium mt-1">{errors.thoiGianBatDau}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="thoiGianKetThuc" required className="text-sm">
              Thời gian kết thúc
            </Label>
            <DateTimePicker
              value={data.thoiGianKetThuc}
              onChange={(value) => handleChange('thoiGianKetThuc', value)}
              placeholder="Chọn thời gian kết thúc"
              error={!!errors.thoiGianKetThuc}
            />
            {errors.thoiGianKetThuc && (
              <p className="text-xs text-red-600 font-medium mt-1">{errors.thoiGianKetThuc}</p>
            )}
          </div>
        </div>

        {/* Địa điểm - Select Phòng Họp */}
        <div className="space-y-1.5">
          <Label htmlFor="diaDiem" required className="text-sm">
            Địa điểm
          </Label>
          <CustomSelect
            value={data.diaDiem}
            onChange={(value) => handleChange('diaDiem', value)}
            options={phongHopOptions}
            placeholder="Chọn phòng họp"
            error={!!errors.diaDiem}
          />
          {errors.diaDiem && (
            <p className="text-xs text-red-600 font-medium mt-1">{errors.diaDiem}</p>
          )}
        </div>

        {/* Accordion: Rút gọn thông tin */}
        <div className="border border-gray-400 rounded-xl overflow-hidden hover:border-gray-500 transition-colors">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-between pl-4 pr-3 py-2.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors gap-2"
          >
            <span className="text-sm font-semibold text-gray-700 flex-1">Rút gọn thông tin</span>
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4 text-gray-500 shrink-0 ml-auto" />
            ) : (
              <ChevronUp className="h-4 w-4 text-gray-500 shrink-0 ml-auto" />
            )}
          </button>

          {!isCollapsed && (
            <div className="p-4 space-y-3.5 bg-white border-t border-gray-300">
              {/* Loại phiên họp */}
              <div className="space-y-1.5">
                <Label htmlFor="loaiPhienHop" className="text-sm">
                  Loại phiên họp
                </Label>
                <CustomSelect
                  value={data.loaiPhienHop}
                  onChange={(value) => handleChange('loaiPhienHop', value)}
                  options={loaiPhienHopOptions}
                  placeholder="-- Chọn loại phiên họp --"
                />
              </div>

              {/* Link họp trực tuyến */}
              <div className="space-y-1.5">
                <Label htmlFor="linkHopTrucTuyen" className="text-sm">
                  Link họp trực tuyến
                </Label>
                <Input
                  id="linkHopTrucTuyen"
                  type="url"
                  value={data.linkHopTrucTuyen}
                  onChange={(e) => handleChange('linkHopTrucTuyen', e.target.value)}
                  placeholder="Nhập link phòng họp"
                  className="h-10 rounded-xl border-gray-400 hover:border-gray-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Nội dung chương trình họp */}
      <div className="space-y-4">
        {/* Nội dung chương trình họp */}
        <div className="space-y-2.5">
          <Label className="text-sm">Nội dung chương trình họp</Label>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="noiDungChuongTrinh"
                value="upload"
                checked={data.noiDungChuongTrinh === 'upload'}
                onChange={() => handleChange('noiDungChuongTrinh', 'upload')}
                className="w-4 h-4 text-[#C8102E] border-gray-300 focus:ring-[#C8102E]"
              />
              <span className="text-sm text-gray-700 font-medium">Tải tài liệu</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="noiDungChuongTrinh"
                value="text"
                checked={data.noiDungChuongTrinh === 'text'}
                onChange={() => handleChange('noiDungChuongTrinh', 'text')}
                className="w-4 h-4 text-[#C8102E] border-gray-300 focus:ring-[#C8102E]"
              />
              <span className="text-sm text-gray-700 font-medium">Nhập văn bản</span>
            </label>
          </div>

          {/* Editor or Upload based on selection */}
          {data.noiDungChuongTrinh === 'text' ? (
            <RichTextEditor
              value={data.noiDungChuongTrinhText || ''}
              onChange={(value) => handleChange('noiDungChuongTrinhText', value)}
              placeholder="Nhập nội dung chương trình họp..."
              minHeight="340px"
            />
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 px-4 border-2 border-dashed border-gray-400 rounded-xl hover:border-[#C8102E]/60 hover:bg-red-50/30 transition-all cursor-pointer bg-gray-50/50">
              <Upload className="h-9 w-9 text-gray-400 mb-2.5" />
              <p className="text-sm text-gray-600 text-center">
                <span className="font-semibold text-[#C8102E]">Chọn file</span> hoặc kéo thả
              </p>
              <p className="text-xs text-gray-500 mt-1.5">Tối đa 50MB • .pdf, .doc, .docx</p>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
            </label>
          )}
        </div>

        {/* Giấy mời */}
        <div className="space-y-1.5">
          <Label className="text-sm">Giấy mời</Label>
          <label className="flex flex-col items-center justify-center w-full h-28 px-4 border-2 border-dashed border-gray-400 rounded-xl hover:border-[#C8102E]/60 hover:bg-red-50/30 transition-all cursor-pointer bg-gray-50/50">
            <FileText className="h-7 w-7 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 text-center">
              <span className="font-semibold text-[#C8102E]">Chọn file</span> hoặc kéo thả
            </p>
            <p className="text-xs text-gray-500 mt-1">Tối đa 50MB • .pdf</p>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
          </label>
        </div>
      </div>
    </div>
  );
};

export { ChiTietHopStep };
export type { ChiTietHopData };
