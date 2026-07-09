import React from 'react';
import { X, FileText, Download, Eye, Calendar, User, Briefcase } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Opinion } from '../meeting.mock';
import { downloadDocument, viewDocument, getFileIconStyle } from '@/common/utils/fileHelpers';

interface ViewOpinionModalProps {
  isOpen: boolean;
  onClose: () => void;
  opinion: Opinion | null;
  guestToken?: string | null;
}

export const ViewOpinionModal: React.FC<ViewOpinionModalProps> = ({
  isOpen,
  onClose,
  opinion,
  guestToken,
}) => {
  if (!isOpen || !opinion) return null;

  const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header - Styled with gradient subtle line and premium title */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 rounded-full bg-[#C8102E]" />
            <h3 className="text-lg font-bold text-gray-900 heading">Chi tiết ý kiến góp ý</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="px-6 py-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Delegate info card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#C8102E]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Người góp ý</p>
                <p className="text-sm font-semibold text-gray-800">{opinion.userName || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Chức vụ</p>
                <p className="text-sm font-semibold text-gray-800">{opinion.userPosition || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:col-span-2 pt-2 border-t border-gray-200/60 mt-1">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Thời gian gửi</p>
                <p className="text-sm font-semibold text-gray-800">{opinion.createdAt || '-'}</p>
              </div>
            </div>
          </div>

          {/* Target document or content information */}
          {opinion.documentName && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Góp ý cho tài liệu</h4>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50/50 border border-amber-100 rounded-lg text-amber-900 text-sm">
                <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-medium">{opinion.documentName}</span>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nội dung góp ý</h4>
            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-inner min-h-[100px] whitespace-pre-wrap text-sm text-gray-800 leading-relaxed body">
              {opinion.opinionDetail || <span className="text-gray-400 italic">Không có nội dung chi tiết.</span>}
            </div>
          </div>

          {/* Attachments */}
          {(() => {
            const filteredAttachments = opinion.attachments?.filter(
              (att) => att.name !== opinion.documentName
            ) || [];
            
            return (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Tài liệu đính kèm ({filteredAttachments.length})
                </h4>
                {filteredAttachments.length > 0 ? (
                  <div className="space-y-2">
                    {filteredAttachments.map((doc, idx) => {
                      const isPdf = doc.name?.toLowerCase().endsWith('.pdf');
                      const iconStyle = getFileIconStyle(doc.name);
                      const IconComponent = iconStyle.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-150 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-lg ${iconStyle.bg} flex items-center justify-center ${iconStyle.text} shrink-0`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate pr-2">
                            {doc.name}
                          </p>
                          {doc.size ? (
                            <p className="text-xs text-gray-500 mt-0.5">{formatSize(doc.size)}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isPdf && doc.documentId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-gray-500 hover:text-[#C8102E] hover:bg-red-50 rounded-lg"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              viewDocument(doc.documentId!, guestToken || undefined);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {doc.documentId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-gray-500 hover:text-[#C8102E] hover:bg-red-50 rounded-lg"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              downloadDocument(doc.documentId!, doc.name, guestToken || undefined);
                            }}
                          >
                            <Download className="w-4.5 h-4.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Không có tài liệu đính kèm.</p>
            )}
          </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-5 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
