import React from 'react';
import { Button } from '@/common/components/ui/button';
import { Eye, FileText } from 'lucide-react';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { TableEngineConfig } from '@/common/components/table-engine/table.types';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';

interface MeetingOpinionSectionProps {
    opinions: any[];
    onAddOpinion: () => void;
    onViewOpinion: (opinion: any) => void;
    disabled?: boolean;
}

export const MeetingOpinionSection: React.FC<MeetingOpinionSectionProps> = ({
    opinions,
    onAddOpinion,
    onViewOpinion,
    disabled = false,
}) => {
    const opinionTableConfig: TableEngineConfig<any> = {
        columns: [
            {
                key: "userName",
                header: "Tên đại biểu",
            },
            {
                key: "userPosition",
                header: "Chức vụ",
                render: (row: any) => row.userPosition || "-",
            },
            {
                key: "opinionDetail",
                header: "Chi tiết góp ý",
                render: (row: any) => (
                    <div className="max-w-[300px] truncate" title={row.opinionDetail}>
                        {row.opinionDetail}
                    </div>
                ),
            },
            {
                key: "documentName",
                header: "Tài liệu góp ý",
                render: (row: any) => row.documentName || "-",
            },
            {
                key: "attachmentsCount",
                header: "Tài liệu đính kèm",
                align: "center",
                render: (row: any) => {
                    const count = row.attachments?.length || 0;
                    if (count === 0) return "-";
                    return (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                            <FileText className="w-3.5 h-3.5" />
                            {count} file
                        </span>
                    );
                }
            },
            {
                key: "id",
                header: "Hành động",
                width: "100px",
                align: "center",
                render: (row: any) => {
                    return (
                        <div className="flex justify-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-500 hover:text-[#C8102E] hover:bg-red-50 rounded-lg w-8 h-8"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onViewOpinion(row);
                                }}
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
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
            {!disabled && (
                <div className="p-4 bg-white border-b border-gray-100 flex justify-end">
                    <Button
                        variant="primary"
                        className="bg-[#C8102E] hover:bg-[#a80d26] rounded-full px-5 h-[38px] text-white font-medium shadow-sm transition-all"
                        onClick={onAddOpinion}
                    >
                        Thêm ý kiến góp ý
                    </Button>
                </div>
            )}
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
