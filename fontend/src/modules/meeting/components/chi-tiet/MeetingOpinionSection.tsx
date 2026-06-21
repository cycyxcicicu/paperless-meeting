import React from 'react';
import { Button } from '@/common/components/ui/button';
import { Eye } from 'lucide-react';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { TableEngineConfig } from '@/common/components/table-engine/table.types';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';

interface MeetingOpinionSectionProps {
    opinions: any[];
    setIsOpinionModalOpen: (open: boolean) => void;
    viewDocument: (docId: string) => void;
}

export const MeetingOpinionSection: React.FC<MeetingOpinionSectionProps> = ({
    opinions,
    setIsOpinionModalOpen,
    viewDocument,
}) => {
    const opinionTableConfig: TableEngineConfig<any> = {
        columns: [
            {
                key: "delegateName",
                header: "Tên đại biểu",
            },
            {
                key: "positionName",
                header: "Chức vụ",
                render: (row: any) => row.positionName || "-",
            },
            {
                key: "opinionDetail",
                header: "Chi tiết góp ý",
            },
            {
                key: "documentName",
                header: "Tài liệu góp ý",
                render: (row: any) => row.documentName || "-",
            },
            {
                key: "id",
                header: "Hành động",
                width: "128px",
                align: "center",
                render: (row: any) => {
                    const hasAttachments = row.attachments && row.attachments.length > 0;
                    return (
                        <div className="flex justify-center gap-2">
                            {hasAttachments && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-500 hover:text-[#C8102E]"
                                    onClick={() => {
                                        const attachment = row.attachments[0];
                                        viewDocument(attachment.documentId);
                                    }}
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    );
                },
            },
        ],
    };

    return (
        <CollapsibleSection
            title={`Danh sách tham gia góp ý (${opinions.length})`}
            defaultExpanded={false}
        >
            <div className="p-4 bg-white border-b border-gray-100 flex justify-end">
                <Button
                    variant="primary"
                    className="bg-[#C8102E] hover:bg-[#a80d26] rounded-full px-5 h-[38px] text-white font-medium shadow-sm transition-all"
                    onClick={() => setIsOpinionModalOpen(true)}
                >
                    Thêm ý kiến góp ý
                </Button>
            </div>
            <div className="min-h-[200px]">
                <DataTable
                    data={opinions}
                    config={opinionTableConfig}
                    pageSize={5}
                    totalItems={opinions.length}
                    onPageChange={() => {}}
                />
            </div>
        </CollapsibleSection>
    );
};
