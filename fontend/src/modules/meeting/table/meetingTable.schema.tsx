import React from 'react';
import { ColumnDef, TableActionDef } from "@/common/components/table-engine/table.types";
import { Eye, Edit2, Copy, Send, Ban, FileUp } from 'lucide-react';
import { Badge } from '@/common/components/ui/badge';

export interface Meeting {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    host: string;
    participants: number;
    documents: number;
    status: string;
    statusVariant: "success" | "warning" | "info" | "default" | "destructive" | "secondary";
    
    canEdit?: boolean;
    canCancel?: boolean;
    canPublish?: boolean;
    canDelete?: boolean;
    canSubmitApproval?: boolean;
    canUploadDocs?: boolean;
    canCopy?: boolean;
    canApprove?: boolean;
    rawStatus?: string;
    isSaved?: boolean;
    callerInviteStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    callerRole?: string;
}

export const createMeetingColumns = (handlers: {
    onView: (id: string) => void;
    onUpdate: (id: string) => void;
    onCopy: (id: string) => void;
    onCancel: (id: string) => void;
    onSend: (id: string) => void;
}): ColumnDef<Meeting>[] => [
    {
        key: "title",
        header: "Phiên họp",
        render: (row: Meeting) => (
            <div className="flex flex-col max-w-[320px]">
                <span 
                    onClick={() => handlers.onView(row.id)} 
                    className="font-bold text-gray-900 text-sm hover:text-[#C8102E] cursor-pointer transition-colors truncate"
                >
                    {row.title}
                </span>
                <span className="text-xs text-gray-500 mt-0.5 truncate">
                    Địa điểm: {row.location || 'Chưa xác định'}
                </span>
            </div>
        )
    },
    {
        key: "host",
        header: "Chủ trì",
        render: (row: Meeting) => (
            <span className="text-sm text-gray-700 font-medium">{row.host || 'Chưa xác định'}</span>
        )
    },
    {
        key: "date",
        header: "Thời gian",
        render: (row: Meeting) => (
            <span className="text-sm text-gray-700 font-medium">{row.time}</span>
        )
    },
    {
        key: "status",
        header: "Trạng thái",
        render: (row: Meeting) => (
            <Badge
                variant={row.statusVariant}
                className={`h-[26px] px-2.5 text-xs rounded-full whitespace-nowrap body flex items-center justify-center w-fit ${
                    row.rawStatus === 'IN_PROGRESS' ? 'animate-pulse' : ''
                }`}
            >
                {row.rawStatus === 'IN_PROGRESS' && (
                    <span className="flex h-1.5 w-1.5 relative mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                )}
                {row.status}
            </Badge>
        )
    }
];

export const createMeetingRowActions = (handlers: {
    onView: (id: string) => void;
    onUpdate: (id: string) => void;
    onCopy: (id: string) => void;
    onCancel: (id: string) => void;
    onSend: (id: string) => void;
    onUploadDocs: (id: string) => void;
}): TableActionDef<Meeting>[] => [
    {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <Eye className="h-4 w-4" />,
        variant: 'primary',
        onClick: (row: Meeting) => handlers.onView(row.id)
    },
    {
        key: 'update',
        label: 'Cập nhật',
        icon: <Edit2 className="h-4 w-4" />,
        variant: 'warning',
        onClick: (row: Meeting) => handlers.onUpdate(row.id),
        show: (row: Meeting) => !!row.canEdit || !!row.canApprove
    },
    {
        key: 'uploadDocs',
        label: 'Cập nhật tài liệu',
        icon: <FileUp className="h-4 w-4" />,
        variant: 'primary',
        onClick: (row: Meeting) => handlers.onUploadDocs(row.id),
        show: (row: Meeting) => !!row.canUploadDocs && !row.canEdit
    },
    {
        key: 'send',
        label: 'Công bố / Gửi duyệt',
        icon: <Send className="h-4 w-4" />,
        variant: 'primary',
        onClick: (row: Meeting) => handlers.onSend(row.id),
        show: (row: Meeting) => !!row.canPublish || !!row.canSubmitApproval
    },
    {
        key: 'copy',
        label: 'Sao chép',
        icon: <Copy className="h-4 w-4" />,
        variant: 'default',
        onClick: (row: Meeting) => handlers.onCopy(row.id),
        show: (row: Meeting) => !!row.canCopy
    },
    {
        key: 'cancel',
        label: 'Hủy cuộc họp',
        icon: <Ban className="h-4 w-4" />,
        variant: 'danger',
        onClick: (row: Meeting) => handlers.onCancel(row.id),
        show: (row: Meeting) => !!row.canCancel
    }
];
