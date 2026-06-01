import React from 'react';
import { Upload, FileText, FileSpreadsheet, File as FileIcon, Trash2, Plus, Eye, X, Download } from 'lucide-react';
import { Label } from './label';

export interface FileUploaderProps {
  files: any[];
  onChange: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  placeholder?: string;
  allowedExtensionsText?: string;
}

export const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    return <FileText className="h-8 w-8 text-red-500 flex-shrink-0 animate-pulse" />;
  }
  if (['doc', 'docx'].includes(ext || '')) {
    return <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />;
  }
  if (['xls', 'xlsx'].includes(ext || '')) {
    return <FileSpreadsheet className="h-8 w-8 text-green-500 flex-shrink-0" />;
  }
  return <FileIcon className="h-8 w-8 text-gray-500 flex-shrink-0" />;
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
  accept = '.pdf,.doc,.docx,.xls,.xlsx',
  maxSizeMB = 50,
  label,
  placeholder,
  allowedExtensionsText = 'PDF, DOC, DOCX, XLS, XLSX',
}) => {
  const [previewFile, setPreviewFile] = React.useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>('');
  const [textPreviewContent, setTextPreviewContent] = React.useState<string>('');

  React.useEffect(() => {
    if (!previewFile) {
      setPreviewUrl('');
      setTextPreviewContent('');
      return;
    }

    const ext = previewFile.name.split('.').pop()?.toLowerCase();

    if (previewFile instanceof File) {
      const objectUrl = URL.createObjectURL(previewFile);
      setPreviewUrl(objectUrl);

      if (ext === 'txt') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextPreviewContent(e.target?.result as string || '');
        };
        reader.readAsText(previewFile);
      }

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      // Pre-existing file with direct URL
      const directUrl = previewFile.url || previewFile.fileUrl || '';
      setPreviewUrl(directUrl);
    }
  }, [previewFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    // Size check
    const maxSize = maxSizeMB * 1024 * 1024;
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (file.size > maxSize) {
        alert(`File ${file.name} vượt quá dung lượng ${maxSizeMB}MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (multiple) {
      onChange([...files, ...validFiles]);
    } else {
      onChange(validFiles.slice(0, 1));
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updated = files.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium text-gray-700">{label}</Label>}

      {files.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Map over uploaded files */}
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(file.name)}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              {/* Flex actions container */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewFile(file)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Xem trước tài liệu"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa tài liệu"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Elegant plus sign card to add more files if multiple is true */}
          {multiple && (
            <label className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 hover:bg-red-50/30 hover:border-[#C8102E]/60 transition-all cursor-pointer group h-[62px]">
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

      {/* Premium File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in transition-all">
          <div className="relative bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 mx-4 transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(previewFile.name)}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[400px] sm:max-w-[500px]" title={previewFile.name}>
                    {previewFile.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(previewFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-gray-100/50 p-4 sm:p-6 overflow-auto flex flex-col justify-center items-center">
              {(() => {
                const ext = previewFile.name.split('.').pop()?.toLowerCase() || '';

                if (ext === 'pdf') {
                  return (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0 rounded-xl bg-white shadow-sm"
                      title={previewFile.name}
                    />
                  );
                }

                if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
                  return (
                    <div className="relative max-w-full max-h-full flex items-center justify-center bg-white p-4 rounded-xl shadow-sm overflow-hidden">
                      <img
                        src={previewUrl}
                        alt={previewFile.name}
                        className="max-w-full max-h-[65vh] object-contain rounded-lg"
                      />
                    </div>
                  );
                }

                if (ext === 'txt') {
                  return (
                    <div className="w-full h-full bg-white p-6 rounded-xl border border-gray-200 overflow-auto shadow-sm">
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap font-normal leading-relaxed">
                        {textPreviewContent || 'Đang tải nội dung văn bản...'}
                      </pre>
                    </div>
                  );
                }

                // Fallback for Word, Excel, PPT etc.
                return (
                  <div className="flex flex-col items-center text-center p-8 bg-white rounded-2xl max-w-md shadow-sm border border-gray-100">
                    <div className="p-4 bg-red-50 rounded-2xl mb-4">
                      {getFileIcon(previewFile.name)}
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      Không thể xem trực tiếp định dạng này
                    </h4>
                    <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
                      Trình duyệt không hỗ trợ xem trước tệp <span className="font-semibold text-gray-700">.{ext.toUpperCase()}</span> trực tiếp. Vui lòng tải về máy để xem chi tiết.
                    </p>
                    <a
                      href={previewUrl}
                      download={previewFile.name}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8102E] hover:bg-[#a80d26] text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      <Download className="h-4 w-4" />
                      Tải tệp xuống
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
