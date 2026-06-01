import { ColumnDef } from "@/common/components/table-engine/table.types";

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
    canPostpone?: boolean;
    canDelete?: boolean;
    canSubmitApproval?: boolean;
    canUploadDocs?: boolean;
    canCopy?: boolean;
}

export const createMeetingColumns = (handlers: {
    onView: (id: string) => void;
    onUpdate: (id: string) => void;
    onCopy: (id: string) => void;
    onPostpone: (id: string) => void;
    onCancel: (id: string) => void;
    onSend: (id: string) => void;
}): ColumnDef<Meeting>[] => [
    {
        key: "title",
        header: "Phiên họp",
    },
    {
        key: "host",
        header: "Chủ trì",
    },
    {
        key: "date",
        header: "Ngày họp",
    },
    {
        key: "status",
        header: "Trạng thái",
    }
];

export const createMeetingRowActions = (handlers: {
    onView: (id: string) => void;
    onUpdate: (id: string) => void;
    onCopy: (id: string) => void;
    onPostpone: (id: string) => void;
    onCancel: (id: string) => void;
    onSend: (id: string) => void;
}) => [
    {
        key: 'view',
        label: 'Xem chi tiết',
        variant: 'primary' as const,
        onClick: (row: Meeting) => handlers.onView(row.id)
    },
    {
        key: 'update',
        label: 'Cập nhật',
        variant: 'warning' as const,
        onClick: (row: Meeting) => handlers.onUpdate(row.id),
        show: (row: Meeting) => !!row.canEdit
    },
    {
        key: 'copy',
        label: 'Sao chép',
        onClick: (row: Meeting) => handlers.onCopy(row.id)
    }
];
