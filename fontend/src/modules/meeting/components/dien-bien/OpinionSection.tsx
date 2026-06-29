import React from 'react';
import { Card } from '@/common/components/ui/card';
import { Button } from '@/common/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { Opinion } from '../../meeting.mock';

interface OpinionSectionProps {
    opinions: Opinion[];
    onAddOpinion: () => void;
    onViewOpinion?: (opinion: Opinion) => void;
    isGuest?: boolean;
    meetingStatus?: string;
    isAttendee?: boolean;
}

export function OpinionSection({ opinions, onAddOpinion, onViewOpinion, isGuest, meetingStatus, isAttendee = false }: OpinionSectionProps) {
    const config = {
        columns: [
            { key: 'userName', header: 'Tên đại biểu' },
            { key: 'userPosition', header: 'Chức vụ' },
            { key: 'opinionDetail', header: 'Chi tiết góp ý', render: (row: Opinion) => (
                <div className="space-y-1">
                    {row.documentName && <p className="text-xs text-gray-500">Tài liệu: {row.documentName}</p>}
                    <p className="text-gray-900">{row.opinionDetail}</p>
                    {row.attachments.length > 0 && <p className="text-xs text-blue-600">{row.attachments.length} tài liệu đính kèm</p>}
                </div>
            )},
            { key: 'id', header: 'Hành động', width: '100px', align: 'center' as const, render: (row: Opinion) => (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-500 hover:text-[#C8102E]"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onViewOpinion?.(row);
                    }}
                >
                    <Eye className="w-4 h-4" />
                </Button>
            )}
        ]
    };

    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CollapsibleSection
                title={`Danh sách tham gia góp ý (${opinions.length})`}
                action={
                    isAttendee && !isGuest && meetingStatus === "IN_PROGRESS" && (
                        <Button variant="primary" size="sm" className="bg-[#C8102E] hover:bg-[#a80d26] h-9 gap-1.5" onClick={onAddOpinion}>
                            <Plus className="w-4 h-4" />
                            <span className="text-sm body">Thêm</span>
                        </Button>
                    )
                }
            >
                <div className="p-0">
                    <DataTable data={opinions} config={config} pageSize={10} totalItems={opinions.length} onPageChange={() => {}} />
                </div>
            </CollapsibleSection>
        </Card>
    );
}
