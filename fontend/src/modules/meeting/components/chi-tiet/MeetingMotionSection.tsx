import React from 'react';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { TableEngineConfig } from '@/common/components/table-engine/table.types';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';
import { cn } from '@/common/utils/cn';

interface MeetingMotionSectionProps {
    motions: any[];
    agendaItems: any[];
    handleViewVoteStats: (motion: any) => void;
}

export const MeetingMotionSection: React.FC<MeetingMotionSectionProps> = ({
    motions,
    agendaItems,
    handleViewVoteStats,
}) => {
    const votingTableConfig: TableEngineConfig<any> = {
        columns: [
            {
                key: "agendaItemId",
                header: "Thuộc nội dung",
                width: "220px",
                render: (row: any) => {
                    const item = agendaItems.find((i: any) => i.id === row.agendaItemId);
                    if (!item) return "-";
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-blue-700">
                                {item.orderNo ? `Nội dung ${item.orderNo}` : "Nội dung"}
                            </span>
                            <span
                                className="text-xs text-gray-500 max-w-[200px] truncate"
                                title={item.title}
                            >
                                {item.title}
                            </span>
                        </div>
                    );
                },
            },
            { key: "title", header: "Vấn đề" },
            {
                key: "status",
                header: "Trạng thái",
                width: "160px",
                render: (row: any) => {
                    const isPending = row.status === "DRAFT";
                    return (
                        <Badge
                            className={cn(
                                "px-3 py-1 text-xs rounded-full border-none",
                                isPending
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700",
                            )}
                        >
                            {isPending ? "Chưa biểu quyết" : "Đã hoàn thành"}
                        </Badge>
                    );
                },
            },
            {
                key: "actions",
                header: "Hành động",
                align: "center",
                width: "150px",
                render: (row: any) => {
                    return (
                        <div className="flex justify-center gap-2">
                            {row.status === "CLOSED" && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 text-xs"
                                    onClick={() => handleViewVoteStats(row)}
                                >
                                    Xem kết quả
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
            title={`Danh sách vấn đề cần biểu quyết (${motions.length})`}
            defaultExpanded={false}
        >
            <div className="min-h-[200px]">
                <DataTable
                    data={motions}
                    config={votingTableConfig}
                    pageSize={5}
                    totalItems={motions.length}
                    onPageChange={() => {}}
                />
            </div>
        </CollapsibleSection>
    );
};
