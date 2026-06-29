import React, { useState } from 'react';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { TableEngineConfig } from '@/common/components/table-engine/table.types';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';
import { cn } from '@/common/utils/cn';

interface MeetingSpeakerRegistrationSectionProps {
    spokenSpeakers: any[];
    rejectedSpeakers: any[];
    meetingDetail: any;
    handleStartSpeakerTurn: (id: string | number) => void;
    handleRejectSpeakRequest: (id: string | number) => void;
}

export const MeetingSpeakerRegistrationSection: React.FC<MeetingSpeakerRegistrationSectionProps> = ({
    spokenSpeakers,
    rejectedSpeakers,
    meetingDetail,
    handleStartSpeakerTurn,
    handleRejectSpeakRequest,
}) => {
    const [activeTab, setActiveTab] = useState<"phat-bieu" | "bac-bo">("phat-bieu");

    const speakerTableConfig: TableEngineConfig<any> = {
        columns: [
            { key: "userName", header: "Tên đại biểu" },
            { key: "position", header: "Chức vụ", render: (row: any) => row.position || "-" },
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
                            row.queueStatus === "SPEAKING"
                                ? "bg-blue-100 text-blue-700"
                                : row.queueStatus === "DONE"
                                  ? "bg-green-100 text-green-700"
                                  : row.queueStatus === "REJECTED"
                                    ? "bg-red-105 text-red-750"
                                    : "bg-gray-100 text-gray-700",
                        )}
                    >
                        {row.queueStatus === "SPEAKING"
                            ? "Đang phát biểu"
                            : row.queueStatus === "DONE"
                              ? "Đã phát biểu"
                              : row.queueStatus === "REJECTED"
                                ? "Bác bỏ"
                                : row.queueStatus}
                    </Badge>
                ),
            },
        ],
    };

    return (
        <CollapsibleSection
            title={`Danh sách phát biểu (${spokenSpeakers.length + rejectedSpeakers.length})`}
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
                                left: activeTab === "phat-bieu" ? "4px" : "calc(50%)",
                            }}
                        />
                        <button
                            onClick={() => setActiveTab("phat-bieu")}
                            className={cn(
                                "relative z-10 flex-1 py-2 text-center text-sm font-semibold transition-colors duration-250",
                                activeTab === "phat-bieu"
                                    ? "text-white"
                                    : "text-gray-500 hover:text-gray-800",
                            )}
                        >
                            Phát biểu ({spokenSpeakers.length})
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
                            transform: activeTab === "phat-bieu" ? "translateX(0%)" : "translateX(-100%)",
                        }}
                    >
                        {/* Pane 1: Phát biểu */}
                        <div className="w-full shrink-0">
                            <DataTable
                                data={spokenSpeakers}
                                config={speakerTableConfig}
                                pageSize={5}
                                totalItems={spokenSpeakers.length}
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
