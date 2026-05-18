import React from 'react';
import { Card } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';
import { SpeakerActionMenu } from '@/modules/meeting/components/SpeakerActionMenu';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { cn } from '@/common/utils/cn';
import { Speaker } from '../../meeting.mock';

interface SpeakerSectionProps {
    speakers: Speaker[];
    activeTab: "cho" | "bac-bo";
    onTabChange: (tab: "cho" | "bac-bo") => void;
    onAddSpeaker: () => void;
    onPrepareSpeech: (id: number) => void;
    onAssignSpeech: (id: number) => void;
    onRejectSpeech: (id: number) => void;
}

export function SpeakerSection({ speakers, activeTab, onTabChange, onAddSpeaker, onPrepareSpeech, onAssignSpeech, onRejectSpeech }: SpeakerSectionProps) {
    const speakerCount = speakers.filter(s => s.status === "speaking" || s.status === "finished").length;

    const config = {
        columns: [
            { key: 'name', header: 'Tên đại biểu' },
            { key: 'position', header: 'Chức vụ' },
            { key: 'note', header: 'Ghi chú', render: (row: Speaker) => row.note || '-' },
            { key: 'startTime', header: 'Thời gian bắt đầu', render: (row: Speaker) => row.startTime || '-' },
            { key: 'status', header: 'Trạng thái', render: (row: Speaker) => (
                <Badge className={cn("px-3 py-1 text-xs rounded-full border-none", row.status === 'speaking' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700")}>
                    {row.status === 'speaking' ? 'Đang phát biểu' : 'Đã kết thúc'}
                </Badge>
            )},
            { key: 'id', header: 'Hành động', width: '100px', align: 'center' as const, render: (row: Speaker) => (
                <SpeakerActionMenu speakerId={row.id} onPrepare={onPrepareSpeech} onAssign={onAssignSpeech} onReject={onRejectSpeech} />
            )}
        ]
    };

    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CollapsibleSection
                title={`Danh sách phát biểu (${speakerCount})`}
                action={
                    <Button variant="primary" size="sm" className="bg-[#C8102E] hover:bg-[#a80d26] h-9 gap-1.5" onClick={onAddSpeaker}>
                        <Plus className="w-4 h-4" />
                        <span className="text-sm body">Thêm người phát biểu</span>
                    </Button>
                }
            >
                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-gray-200 mb-4 px-2">
                    {(["cho", "bac-bo"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`pb-3 body text-[15px] border-b-2 transition-colors ${activeTab === tab ? "border-[#C8102E] text-[#C8102E]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            {tab === "cho" ? "Chờ phát biểu" : "Bác bỏ"}
                        </button>
                    ))}
                </div>

                <div className="p-0">
                    <DataTable
                        data={speakers.filter(s => s.status === "speaking" || s.status === "finished")}
                        config={config}
                        pageSize={10}
                        totalItems={speakerCount}
                        onPageChange={() => {}}
                    />
                </div>
            </CollapsibleSection>
        </Card>
    );
}
