import React from 'react';
import { Upload, Trash2, Plus, Eye, X, Download } from 'lucide-react';
import { Label } from './label';
import { toast } from '@/lib/toast';
import { viewDocument, downloadDocument, getFileIconStyle } from '@/common/utils/fileHelpers';
import { TableTooltip } from '@/common/components/table-engine/TableTooltip';

export interface FileUploaderProps {
  files: any[];
  onChange: (files: any[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  placeholder?: string;
  allowedExtensionsText?: string;
  disabled?: boolean;
  currentUserId?: string;
}

export const getFileIcon = (fileName: string) => {
  const style = getFileIconStyle(fileName);
  const Icon = style.icon;
  const pulseClass = fileName.toLowerCase().endsWith('.pdf') ? ' animate-pulse' : '';
  return <Icon className={`h-8 w-8 ${style.text} flex-shrink-0${pulseClass}`} />;
};

export const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileUploader: React.FC<FileUploaderProps> = ({
  files = [],
  onChange,
  multiple = false,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.zip',
  maxSizeMB = 20,
  label,
  placeholder,
  allowedExtensionsText = 'PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG, JPEG, TXT, ZIP',
  disabled = false,
  currentUserId,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    // Parse allowed extensions
    const allowedExtensions = accept
      ? accept.split(',').map((ext) => ext.trim().toLowerCase())
      : [];

    // Size check & Extension check
    const maxSize = maxSizeMB * 1024 * 1024;
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      // 1. Extension check
      if (allowedExtensions.length > 0) {
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
          toast.error(
            'Định dạng file không hợp lệ',
            `Tệp "${file.name}" không đúng định dạng cho phép (${allowedExtensionsText})`
          );
          continue;
        }
      }

      // 2. Size check
      if (file.size > maxSize) {
        toast.error(
          'Dung lượng file vượt quá giới hạn',
          `Tệp "${file.name}" vượt quá dung lượng tối đa cho phép là ${maxSizeMB}MB`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      if (multiple) {
        onChange([...files, ...validFiles]);
      } else {
        onChange(validFiles.slice(0, 1));
      }
    }

    // Reset the input value so that the same file can be selected again
    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updated = files.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  /**
   * Determines if a file is a server-persisted document (has documentId/id)
   * vs a local File object not yet uploaded.
   */
  const getDocumentId = (file: any): string | null => {
    if (file instanceof File) return null;
    return file.documentId || file.id || null;
  };

  const isPdf = (file: any): boolean => {
    const name = file.name || file.fileName || '';
    return name.toLowerCase().endsWith('.pdf');
  };

  const handleView = (file: any) => {
    const docId = getDocumentId(file);
    if (docId && isPdf(file)) {
      // Server-persisted PDF → use secure backend viewer
      viewDocument(docId);
    } else if (file instanceof File && isPdf(file)) {
      // Local File (not yet uploaded) → open blob URL in new tab
      const objectUrl = URL.createObjectURL(file);
      window.open(objectUrl, '_blank');
    }
  };

  const handleDownload = (file: any) => {
    const docId = getDocumentId(file);
    const fileName = file.name || file.fileName || 'document';
    if (docId) {
      // Server-persisted file → use secure backend download
      downloadDocument(docId, fileName);
    } else if (file instanceof File) {
      // Local File (not yet uploaded) → trigger browser download
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    }
  };

  /**
   * Check if the current user can delete this file.
   * - If currentUserId is not set, allow delete (legacy behavior).
   * - If the file has no createdByUserId, allow delete (legacy behavior).
   * - Otherwise, only the creator can delete.
   */
  const canDelete = (file: any): boolean => {
    if (!currentUserId) return true;
    if (!file.createdByUserId) return true;
    return file.createdByUserId === currentUserId;
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium text-gray-700">{label}</Label>}

      {files.length === 0 ? (
        disabled ? (
          <div className="flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/30 text-gray-500">
            <p className="text-sm">Không có tài liệu đính kèm</p>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#C8102E]/60 hover:bg-red-50/30 transition-all cursor-pointer bg-gray-50/50 group">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 group-hover:text-[#C8102E]/80 transition-colors mb-2" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-[#C8102E]">
                  {placeholder || 'Chọn file'}
                </span>{' '}
                hoặc kéo thả vào đây
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {allowedExtensionsText} (Tối đa {maxSizeMB}MB)
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept={accept}
              multiple={multiple}
              onChange={handleFileChange}
            />
          </label>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Map over uploaded files */}
          {files.map((file, idx) => {
            const docId = getDocumentId(file);
            const filePdf = isPdf(file);

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(file.name || file.fileName || 'file')}
                   <div className="min-w-0">
                    <TableTooltip 
                      text={file.name || file.fileName} 
                      maxLength={20} 
                      className="text-sm font-medium text-gray-900 truncate max-w-[180px] cursor-pointer block" 
                    />
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <span className="text-xs text-gray-500">{formatFileSize(file.size || file.fileSize || 0)}</span>
                      {file.createdByFullName && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          Tạo bởi: {file.createdByFullName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Eye (View) button - only for PDF files */}
                  {filePdf && (
                    <button
                      type="button"
                      onClick={() => handleView(file)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Xem trước tài liệu"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}

                  {/* Download button - for all server-persisted files or local files */}
                  {(docId || file instanceof File) && (
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Tải tài liệu"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}

                  {/* Delete button - only if not disabled and user owns the file */}
                  {!disabled && canDelete(file) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Elegant plus sign card to add more files if multiple is true */}
          {multiple && !disabled && (
            <label className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 hover:bg-red-50/30 hover:border-[#C8102E]/60 transition-all cursor-pointer group h-full min-h-[62px]">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-gray-400 group-hover:text-[#C8102E] transition-colors" />
                <span className="text-sm font-semibold text-gray-600 group-hover:text-[#C8102E] transition-colors">
                  Thêm tài liệu khác
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
};
