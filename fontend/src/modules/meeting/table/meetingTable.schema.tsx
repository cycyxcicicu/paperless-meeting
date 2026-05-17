import { ColumnDef } from "@/common/components/table-engine/table.types";
import { Badge } from "@/common/components/ui/badge";
import { Clock, Users, MapPin, FileText } from "lucide-react";

export interface Meeting {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    host: string;
    participants: number;
    documents: number;
    status: string;
    statusVariant: "success" | "warning" | "info" | "default";
}

export const createMeetingColumns = (handlers: {
    onView: (id: number) => void;
    onUpdate: (id: number) => void;
    onCopy: (id: number) => void;
    onPostpone: (id: number) => void;
    onCancel: (id: number) => void;
    onSend: (id: number) => void;
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
    onView: (id: number) => void;
    onUpdate: (id: number) => void;
    onCopy: (id: number) => void;
    onPostpone: (id: number) => void;
    onCancel: (id: number) => void;
    onSend: (id: number) => void;
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
        show: (row: Meeting) => row.status === "Nháp" || row.status === "Sắp diễn ra"
    },
    {
        key: 'copy',
        label: 'Sao chép',
        onClick: (row: Meeting) => handlers.onCopy(row.id)
    }
];
