import React, { useState } from 'react';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { TableEngineConfig } from '@/common/components/table-engine/table.types';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';
import { cn } from '@/common/utils/cn';

interface MeetingSpeakerRegistrationSectionProps {
    waitingSpeakers: any[];
    rejectedSpeakers: any[];
    meetingDetail: any;
    handleStartSpeakerTurn: (id: string | number) => void;
    handleRejectSpeakRequest: (id: string | number) => void;
}

export const MeetingSpeakerRegistrationSection: React.FC<MeetingSpeakerRegistrationSectionProps> = ({
    waitingSpeakers,
    rejectedSpeakers,
    meetingDetail,
    handleStartSpeakerTurn,
    handleRejectSpeakRequest,
}) => {
    const [activeTab, setActiveTab] = useState<"cho" | "bac-bo">("cho");

    const speakerTableConfig: TableEngineConfig<any> = {
        columns: [
            { key: "userName", header: "Tên đại biểu" },
            { key: "position", header: "Chức vụ", render: () => "-" },
            {
                key: "priority",
                header: "Độ ưu tiên",
                render: (row: any) => row.priority || "-",
            },
            {
                key: "requestedAt",
                header: "Thời gian yêu cầu",
                render: (row: any) =>
                    row.requestedAt
                        ? new Date(row.requestedAt).toLocaleTimeString("vi-VN")
                        : "-",
            },
            {
                key: "queueStatus",
                header: "Trạng thái",
                render: (row: any) => (
                    <Badge
                        className={cn(
                            "px-3 py-1 text-xs rounded-full border-none",
                            row.queueStatus === "QUEUED"
                                ? "bg-amber-100 text-amber-700"
                                : row.queueStatus === "REJECTED"
                                  ? "bg-red-105 text-red-750"
                                  : "bg-gray-100 text-gray-700",
                        )}
                    >
                        {row.queueStatus === "QUEUED"
                            ? "Chờ phát biểu"
                            : row.queueStatus === "REJECTED"
                              ? "Bác bỏ"
                              : row.queueStatus}
                    </Badge>
                ),
            },
            {
                key: "actions",
                header: "Hành động",
                align: "center",
                width: "200px",
                render: (row: any) => {
                    const isChair = meetingDetail?.canEdit;
                    const isInProgress = meetingDetail?.status === "IN_PROGRESS";
                    if (!isChair || !isInProgress || row.queueStatus !== "QUEUED") return "-";

                    return (
                        <div className="flex justify-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 text-xs"
                                onClick={() => handleStartSpeakerTurn(row.id)}
                            >
                                Cho phát biểu
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-650 hover:text-red-800 hover:bg-red-50 px-2 py-1 text-xs"
                                onClick={() => handleRejectSpeakRequest(row.id)}
                            >
                                Bác bỏ
                            </Button>
                        </div>
                    );
                },
            },
        ],
    };

    return (
        <CollapsibleSection
            title={`Danh sách đăng ký phát biểu (${waitingSpeakers.length + rejectedSpeakers.length})`}
            defaultExpanded={false}
        >
            <div className="p-0">
                {/* Tabs with 50/50 and sliding effect */}
                <div className="px-6 pt-4">
                    <div className="relative flex bg-gray-150/80 rounded-xl p-1 mb-4 w-full border border-gray-200">
                        {/* Sliding background indicator */}
                        <div
                            className="absolute top-1 bottom-1 bg-[#C8102E] rounded-lg shadow-sm transition-all duration-300 ease-in-out"
                            style={{
                                width: "calc(50% - 4px)",
                                left: activeTab === "cho" ? "4px" : "calc(50%)",
                            }}
                        />
                        <button
                            onClick={() => setActiveTab("cho")}
                            className={cn(
                                "relative z-10 flex-1 py-2 text-center text-sm font-semibold transition-colors duration-250",
                                activeTab === "cho"
                                    ? "text-white"
                                    : "text-gray-500 hover:text-gray-800",
                            )}
                        >
                            Chờ phát biểu ({waitingSpeakers.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("bac-bo")}
                            className={cn(
                                "relative z-10 flex-1 py-2 text-center text-sm font-semibold transition-colors duration-250",
                                activeTab === "bac-bo"
                                    ? "text-white"
                                    : "text-gray-500 hover:text-gray-800",
                            )}
                        >
                            Bác bỏ ({rejectedSpeakers.length})
                        </button>
                    </div>
                </div>

                <div className="relative overflow-hidden w-full min-h-[200px]">
                    <div
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{
                            transform: activeTab === "cho" ? "translateX(0%)" : "translateX(-100%)",
                        }}
                    >
                        {/* Pane 1: Chờ phát biểu */}
                        <div className="w-full shrink-0">
                            <DataTable
                                data={waitingSpeakers}
                                config={speakerTableConfig}
                                pageSize={5}
                                totalItems={waitingSpeakers.length}
                                onPageChange={() => {}}
                            />
                        </div>
                        {/* Pane 2: Bác bỏ */}
                        <div className="w-full shrink-0">
                            <DataTable
                                data={rejectedSpeakers}
                                config={speakerTableConfig}
                                pageSize={5}
                                totalItems={rejectedSpeakers.length}
                                onPageChange={() => {}}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </CollapsibleSection>
    );
};
