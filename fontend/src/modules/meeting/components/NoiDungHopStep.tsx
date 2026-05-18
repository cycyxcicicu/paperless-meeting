import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Trash2, CalendarIcon } from 'lucide-react';
import { FileUploader } from '@/common/components/ui/FileUploader';
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

interface BieuQuyetIssue {
  id: string;
  ten: string;
  moTa: string;
}

interface NoiDungItem {
  id: string;
  noiDungChiTiet: string;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  nguoiChuanBi: string;
  nguoiDuyet: string;
  taiLieu: File[];
  bieuQuyetIssues: BieuQuyetIssue[];
  thanhPhanThamDu: {
    donVi: Member[];
    khachMoi: any[];
  };
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
}



const NoiDungHopStep: React.FC<NoiDungHopStepProps> = ({
  data,
  onChange,
  singleContentMode,
  errors = {},
  inheritedParticipants,
}) => {
  const [activeContentId, setActiveContentId] = useState(data.contents[0]?.id || '');

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
      nguoiDuyet: '',
      taiLieu: [],
      bieuQuyetIssues: [],
      thanhPhanThamDu: {
        donVi: [],
        khachMoi: [],
      },
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
      <div className="border border-gray-400 rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-1 px-6">
            {data.contents.map((content, index) => (
              <div key={content.id} className="relative group flex items-center">
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
                {!singleContentMode && data.contents.length > 1 && (
                  <button
                    onClick={() => handleRemoveContent(content.id)}
                    className="ml-1 p-0.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}

            {!singleContentMode && (
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
            {/* Nội dung chi tiết */}
            <div className="space-y-2">
              <Label htmlFor="noiDungChiTiet" className="text-sm">
                Nội dung chi tiết <span className="text-[#C8102E]">*</span>
              </Label>
              <Textarea
                id="noiDungChiTiet"
                value={activeContent.noiDungChiTiet}
                onChange={(e) =>
                  handleUpdateContent(activeContentId, { noiDungChiTiet: e.target.value })
                }
                placeholder="Nhập nội dung chi tiết của phiên họp..."
                rows={3}
                className={cn(
                  'resize-none rounded-xl border-gray-400 hover:border-gray-500',
                  errors[activeContentId]?.noiDungChiTiet &&
                    'border-red-500 focus-visible:ring-red-500'
                )}
              />
              {errors[activeContentId]?.noiDungChiTiet && (
                <p className="text-xs text-red-600 body">
                  {errors[activeContentId].noiDungChiTiet}
                </p>
              )}
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
                disabled={participantOptions.length === 0}
              />
            </div>

            {/* Upload tài liệu */}
            <FileUploader
              files={activeContent.taiLieu || []}
              onChange={(files) => handleUpdateContent(activeContentId, { taiLieu: files })}
              multiple={true}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              allowedExtensionsText="PDF, DOC, DOCX, XLS, XLSX"
              label="Tài liệu đính kèm"
            />

            {/* Danh sách vấn đề cần biểu quyết */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Danh sách vấn đề cần biểu quyết</Label>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddBieuQuyetIssue(activeContentId)}
                >
                  <Plus className="h-4 w-4" />
                  Thêm vấn đề mới
                </Button>
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
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveBieuQuyetIssue(activeContentId, issue.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thành phần tham dự */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Thành phần tham dự</Label>
                <p className="text-xs text-gray-500">
                  (Kế thừa từ bước 2)
                </p>
              </div>

              <div className="border border-gray-400 rounded-xl p-4 bg-gray-50/50 space-y-3">
                {/* Đơn vị */}
                {activeContent.thanhPhanThamDu.donVi.length > 0 && (
                  <div>
                    <label className="text-xs btn-primary text-gray-600 uppercase mb-2 block">
                      Đơn vị ({activeContent.thanhPhanThamDu.donVi.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {activeContent.thanhPhanThamDu.donVi.map((member) => (
                        <div
                          key={member.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-400 rounded-lg text-sm"
                        >
                          <span className="body text-gray-900">{member.name}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-600 text-xs">{member.position}</span>
                          <button
                            onClick={() => handleRemoveParticipant('donVi', member.id)}
                            className="ml-1 p-0.5 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Khách mời */}
                {activeContent.thanhPhanThamDu.khachMoi.length > 0 && (
                  <div>
                    <label className="text-xs btn-primary text-gray-600 uppercase mb-2 block">
                      Khách mời ({activeContent.thanhPhanThamDu.khachMoi.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {activeContent.thanhPhanThamDu.khachMoi.map((guest) => (
                        <div
                          key={guest.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-400 rounded-lg text-sm"
                        >
                          <span className="body text-gray-900">{guest.name}</span>
                          <button
                            onClick={() => handleRemoveParticipant('khachMoi', guest.id)}
                            className="ml-1 p-0.5 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {activeContent.thanhPhanThamDu.donVi.length === 0 &&
                  activeContent.thanhPhanThamDu.khachMoi.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500">
                        Chưa có thành phần tham dự. Vui lòng chọn ở bước 2.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { NoiDungHopStep };
export type { NoiDungHopData, NoiDungItem };
