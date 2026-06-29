import React from 'react';
import { Card } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { Plus, Hand, ArrowUp, ArrowDown } from 'lucide-react';
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
    onPrepareSpeech: (id: string | number) => void;
    onAssignSpeech: (id: string | number) => void;
    onRejectSpeech: (id: string | number) => void;
    onReorderSpeech?: (id: string | number, direction: 'up' | 'down') => void;
    onEndSpeaking?: () => void;
    isGuest?: boolean;
    meetingStatus?: string;
    isChairOrSecretary?: boolean;
    onRequestToSpeak?: () => void;
    isAttendee?: boolean;
    isAbsentOnActiveContent?: boolean;
}

export function SpeakerSection({ 
    speakers, 
    activeTab, 
    onTabChange, 
    onAddSpeaker, 
    onPrepareSpeech, 
    onAssignSpeech, 
    onRejectSpeech,
    onReorderSpeech,
    onEndSpeaking,
    isGuest,
    meetingStatus,
    isChairOrSecretary,
    onRequestToSpeak,
    isAttendee = false,
    isAbsentOnActiveContent = false,
}: SpeakerSectionProps) {
    const waitingCount = speakers.filter(s => s.status !== "rejected" && s.status !== "finished").length;
    const rejectedCount = speakers.filter(s => s.status === "rejected").length;
    const isInProgress = meetingStatus === "IN_PROGRESS";

    const baseColumns: any[] = [
        { key: 'name', header: 'Tên đại biểu' },
        { key: 'position', header: 'Chức vụ' },
        { key: 'startTime', header: 'Thời gian bắt đầu', render: (row: Speaker) => row.startTime || '-' },
        { key: 'status', header: 'Trạng thái', render: (row: Speaker) => (
            <Badge className={cn(
                "px-3 py-1 text-xs rounded-full border-none",
                row.status === 'speaking' ? "bg-green-100 text-green-700" : 
                row.status === 'finished' ? "bg-blue-100 text-blue-700" :
                row.status === 'rejected' ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-700"
            )}>
                {row.status === 'speaking' ? 'Đang phát biểu' : 
                 row.status === 'finished' ? 'Đã kết thúc' :
                 row.status === 'rejected' ? 'Bác bỏ' :
                 'Chờ phát biểu'}
            </Badge>
        )}
    ];

    const waitingColumns = [...baseColumns];
    if (isChairOrSecretary && isInProgress && isAttendee) {
        waitingColumns.push({
            key: 'sortOrder',
            header: 'Thứ tự',
            width: '90px',
            align: 'center' as const,
            render: (row: Speaker) => {
                if (row.status !== 'waiting') return '-';
                
                const waitingList = speakers.filter(s => s.status === 'waiting');
                const index = waitingList.findIndex(s => s.id === row.id);
                const isFirst = index === 0;
                const isLast = index === waitingList.length - 1;

                return (
                    <div className="flex items-center justify-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-7 w-7 text-gray-500 hover:text-[#C8102E] disabled:opacity-30 rounded-full"
                            disabled={isFirst}
                            onClick={() => onReorderSpeech && onReorderSpeech(row.id, 'up')}
                            title="Di chuyển lên"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-7 w-7 text-gray-500 hover:text-[#C8102E] disabled:opacity-30 rounded-full"
                            disabled={isLast}
                            onClick={() => onReorderSpeech && onReorderSpeech(row.id, 'down')}
                            title="Di chuyển xuống"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </Button>
                    </div>
                );
            }
        });

        waitingColumns.push({ key: 'id', header: 'Hành động', width: '100px', align: 'center' as const, render: (row: Speaker) => (
            <SpeakerActionMenu speakerId={row.id} speakerStatus={row.status} onPrepare={onPrepareSpeech} onAssign={onAssignSpeech} onReject={onRejectSpeech} onEndSpeaking={onEndSpeaking} />
        )});
    }

    const rejectedColumns = [...baseColumns];

    // Render action button based on role and meeting status
    const renderSpeakerAction = () => {
        if (!isInProgress || !isAttendee) return null;

        if (isChairOrSecretary) {
            // Chủ trì / Thư ký: hiển thị nút mở modal chọn người phát biểu từ danh sách đã điểm danh
            return (
                <Button variant="primary" size="sm" className="bg-[#C8102E] hover:bg-[#a80d26] h-9 gap-1.5" onClick={onAddSpeaker}>
                    <Plus className="w-4 h-4" />
                    <span className="text-sm body">Thêm người phát biểu</span>
                </Button>
            );
        }

        // Thành viên bình thường hoặc khách mời đi thay: hiển thị nút đăng ký phát biểu
        return (
            <Button
                variant="primary"
                size="sm"
                disabled={isAbsentOnActiveContent}
                className={cn(
                    "bg-[#C8102E] hover:bg-[#a80d26] h-9 gap-1.5",
                    isAbsentOnActiveContent && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => {
                    if (isAbsentOnActiveContent) return;
                    if (onRequestToSpeak) onRequestToSpeak();
                }}
                title={isAbsentOnActiveContent ? "Bạn đã báo vắng ở nội dung họp này nên không thể đăng ký phát biểu." : "Đăng ký phát biểu"}
            >
                <Hand className="w-4 h-4" />
                <span className="text-sm body">Đăng ký phát biểu</span>
            </Button>
        );
    };

    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CollapsibleSection
                title={`Danh sách phát biểu (${waitingCount + rejectedCount})`}
                action={renderSpeakerAction()}
            >
                {/* Tabs with 50/50 and sliding effect */}
                <div className="px-6 pt-4">
                    <div className="relative flex bg-gray-100 rounded-xl p-1 mb-4 w-full border border-gray-200">
                        {/* Sliding background indicator */}
                        <div
                            className="absolute top-1 bottom-1 bg-[#C8102E] rounded-lg shadow-sm transition-all duration-300 ease-in-out"
                            style={{
                                width: "calc(50% - 4px)",
                                left: activeTab === "cho" ? "4px" : "calc(50%)",
                            }}
                        />
                        <button
                            onClick={() => onTabChange("cho")}
                            className={cn(
                                "relative z-10 flex-1 py-2 text-center text-sm font-semibold transition-colors duration-250",
                                activeTab === "cho" ? "text-white" : "text-gray-500 hover:text-gray-800"
                            )}
                        >
                            Chờ phát biểu ({waitingCount})
                        </button>
                        <button
                            onClick={() => onTabChange("bac-bo")}
                            className={cn(
                                "relative z-10 flex-1 py-2 text-center text-sm font-semibold transition-colors duration-250",
                                activeTab === "bac-bo" ? "text-white" : "text-gray-500 hover:text-gray-800"
                            )}
                        >
                            Bác bỏ ({rejectedCount})
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
                                data={speakers.filter(s => s.status !== "rejected" && s.status !== "finished")}
                                config={{ columns: waitingColumns }}
                                pageSize={10}
                                totalItems={waitingCount}
                                onPageChange={() => {}}
                            />
                        </div>
                        {/* Pane 2: Bác bỏ */}
                        <div className="w-full shrink-0">
                            <DataTable
                                data={speakers.filter(s => s.status === "rejected")}
                                config={{ columns: rejectedColumns }}
                                pageSize={10}
                                totalItems={rejectedCount}
                                onPageChange={() => {}}
                            />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>
        </Card>
    );
}
