import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Label } from '@/common/components/ui/label';
import { Textarea } from '@/common/components/ui/textarea';
import { CustomSelect } from '@/common/components/ui/custom-select';
import { cn } from '@/common/utils/cn';
import { FileUploader } from '@/common/components/ui/FileUploader';

interface AddOpinionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (opinion: OpinionData) => void;
  documents: { value: string; label: string }[];
}

export interface OpinionData {
  documentId?: string;
  opinionDetail: string;
  attachments: File[];
}

export const AddOpinionModal: React.FC<AddOpinionModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  documents,
}) => {
  const [documentId, setDocumentId] = useState('');
  const [opinionDetail, setOpinionDetail] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setDocumentId('');
    setOpinionDetail('');
    setAttachments([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };



  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

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
      documentId: documentId || undefined,
      opinionDetail,
      attachments,
    });

    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg btn-primary text-gray-900">Thêm mới góp ý</h3>
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
            {/* Tài liệu cần góp ý */}
            <div className="space-y-2">
              <Label htmlFor="documentId" className="text-sm body text-gray-700">
                Tài liệu cần góp ý
              </Label>
              <CustomSelect
                value={documentId}
                onChange={setDocumentId}
                options={documents}
                placeholder="Chọn tài liệu"
                allowClear
              />
            </div>

            {/* Chi tiết góp ý */}
            <div className="space-y-2">
              <Label htmlFor="opinionDetail" className="text-sm body text-gray-700">
                Chi tiết góp ý <span className="text-[#C8102E]">*</span>
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
                <p className="text-xs text-red-600 body">{errors.opinionDetail}</p>
              )}
            </div>

            {/* Tài liệu đính kèm */}
            <FileUploader
              files={attachments}
              onChange={setAttachments}
              multiple={true}
              accept=".doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx,.pdf,.jpeg,.jpg,.png"
              allowedExtensionsText="PDF, Word, Excel, Hình ảnh"
              label="Tài liệu đính kèm"
            />
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
