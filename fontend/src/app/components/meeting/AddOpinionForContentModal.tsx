import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '../ui/hp-button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { CustomSelect } from '../ui/CustomSelect';
import { cn } from '../../../lib/utils';

interface AddOpinionForContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (opinion: OpinionForContentData) => void;
  contents: { value: string; label: string }[];
  documents: { value: string; label: string }[];
  defaultContentId?: string;
}

export interface OpinionForContentData {
  contentId: string;
  documentId?: string;
  opinionDetail: string;
  attachments: File[];
}

export const AddOpinionForContentModal: React.FC<
  AddOpinionForContentModalProps
> = ({ isOpen, onClose, onAdd, contents, documents, defaultContentId }) => {
  const [contentId, setContentId] = useState(defaultContentId || '');
  const [documentId, setDocumentId] = useState('');
  const [opinionDetail, setOpinionDetail] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setContentId(defaultContentId || '');
    setDocumentId('');
    setOpinionDetail('');
    setAttachments([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const allowedExtensions = [
      'doc',
      'docx',
      'xls',
      'xlsx',
      'txt',
      'ppt',
      'pptx',
      'pdf',
      'jpeg',
      'jpg',
      'png',
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    for (const file of fileArray) {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!extension || !allowedExtensions.includes(extension)) {
        alert(`File ${file.name} không đúng định dạng cho phép`);
        continue;
      }

      if (file.size > maxSize) {
        alert(`File ${file.name} vượt quá dung lượng 50MB`);
        continue;
      }

      validFiles.push(file);
    }

    setAttachments([...attachments, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!contentId.trim()) {
      newErrors.contentId = 'Vui lòng chọn nội dung cần góp ý';
    }

    if (!opinionDetail.trim()) {
      newErrors.opinionDetail = 'Vui lòng nhập chi tiết góp ý';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onAdd({
      contentId,
      documentId: documentId || undefined,
      opinionDetail,
      attachments,
    });

    resetForm();
  };

  // Check if documents are available based on selected content
  const hasDocuments = documents.length > 0;
  const isDocumentDisabled = !contentId || !hasDocuments;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Thêm mới góp ý</h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="space-y-5">
            {/* Góp ý cho nội dung */}
            <div className="space-y-2">
              <Label htmlFor="contentId" required className="text-sm font-medium text-gray-700">
                Góp ý cho nội dung
              </Label>
              <CustomSelect
                value={contentId}
                onChange={setContentId}
                options={contents}
                placeholder="Chọn nội dung"
              />
              {errors.contentId && (
                <p className="text-xs text-red-600 font-medium">{errors.contentId}</p>
              )}
            </div>

            {/* Tài liệu cần góp ý */}
            <div className="space-y-2">
              <Label htmlFor="documentId" className="text-sm font-medium text-gray-700">
                Tài liệu cần góp ý
              </Label>
              <CustomSelect
                value={documentId}
                onChange={setDocumentId}
                options={documents}
                placeholder="Chọn tài liệu"
                allowClear
                disabled={isDocumentDisabled}
              />
              {isDocumentDisabled && (
                <p className="text-xs text-gray-500 italic">
                  Để chọn được tài liệu cần chọn nội dung cần góp ý và nội dung đó phải
                  có tài liệu
                </p>
              )}
            </div>

            {/* Chi tiết góp ý */}
            <div className="space-y-2">
              <Label htmlFor="opinionDetail" required className="text-sm font-medium text-gray-700">
                Chi tiết góp ý
              </Label>
              <Textarea
                id="opinionDetail"
                value={opinionDetail}
                onChange={(e) => setOpinionDetail(e.target.value)}
                placeholder="Nhập nội dung góp ý"
                rows={4}
                className={cn(
                  'resize-none rounded-xl border-gray-300 hover:border-gray-400',
                  errors.opinionDetail && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
              {errors.opinionDetail && (
                <p className="text-xs text-red-600 font-medium">{errors.opinionDetail}</p>
              )}
            </div>

            {/* Tài liệu đính kèm */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Tài liệu đính kèm</Label>
              <label className="flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#C8102E]/60 hover:bg-red-50/30 transition-all cursor-pointer bg-gray-50/50">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold text-[#C8102E]">Chọn file</span> hoặc{' '}
                    <span className="font-semibold">Kéo thả từ máy tính</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Tối đa 50MB, định dạng .doc, .docx, .xls, .xlsx, .txt, .ppt, .pptx,
                    .pdf, jpeg, jpg, png
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx,.pdf,.jpeg,.jpg,.png"
                  multiple
                  onChange={handleFileChange}
                />
              </label>

              {/* Danh sách file đã chọn */}
              {attachments.length > 0 && (
                <div className="space-y-2 mt-3">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
                          <Upload className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-5 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-5 py-2 bg-[#C8102E] hover:bg-[#a80d26]"
            >
              Thêm mới
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
