import React from 'react';
import { Button } from '@/common/components/ui/button';
import { Eye, Download, FileText } from 'lucide-react';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';

interface MeetingDocumentSectionProps {
    agendaItems: any[];
    viewDocument: (docId: string) => void;
    downloadDocument: (docId: string, title: string) => void;
}

export const MeetingDocumentSection: React.FC<MeetingDocumentSectionProps> = ({
    agendaItems,
    viewDocument,
    downloadDocument,
}) => {
    const totalDocsCount = agendaItems.reduce(
        (acc: number, item: any) => acc + (item.documents?.length || 0),
        0
    );

    return (
        <CollapsibleSection
            title={`Danh sách tài liệu (${totalDocsCount})`}
            defaultExpanded={false}
        >
            <div className="space-y-4 px-2">
                {agendaItems.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                        Chưa có nội dung họp & tài liệu.
                    </p>
                ) : (
                    agendaItems.map((item: any) => (
                        <div
                            key={item.id}
                            className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 pb-3 mb-3 gap-2">
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-[15px]">
                                        {item.orderNo ? `${item.orderNo}. ` : ""}
                                        {item.title}
                                    </h4>
                                    {item.content && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            {item.content}
                                        </p>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 shrink-0 md:text-right">
                                    <span className="font-medium text-gray-700">
                                        Người chuẩn bị:{" "}
                                    </span>
                                    <span className="text-gray-900">
                                        {item.preparedByFullName || "Chưa phân công"}
                                    </span>
                                </div>
                            </div>

                            {/* Documents attached */}
                            <div className="space-y-2">
                                {!item.documents || item.documents.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">
                                        Không có tài liệu đính kèm.
                                    </p>
                                ) : (
                                    item.documents.map((doc: any) => {
                                        const isPdf =
                                            doc.fileName?.toLowerCase().endsWith(".pdf") ||
                                            doc.title?.toLowerCase().endsWith(".pdf") ||
                                            doc.fileUrl?.toLowerCase().endsWith(".pdf");
                                        return (
                                            <div
                                                key={doc.documentId}
                                                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/70 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                                    <div className="text-xs">
                                                        <span className="text-gray-800">
                                                            {doc.title || doc.fileName || "Tài liệu"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {isPdf && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-7 h-7 text-gray-500 hover:text-[#C8102E]"
                                                            onClick={() => viewDocument(doc.documentId)}
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-7 h-7 text-gray-500 hover:text-[#C8102E]"
                                                        onClick={() =>
                                                            downloadDocument(
                                                                doc.documentId,
                                                                doc.title || doc.fileName
                                                            )
                                                        }
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </CollapsibleSection>
    );
};
