import { ColumnDef } from "@/common/components/table-engine/table.types";
import { Badge } from "@/common/components/ui/badge";

export interface MeetingRoom {
    id: string;
    name: string;
    roomCode: string;
    address: string;
    capacity: number;
    isActive: boolean;
    departmentId: string | null;
    lastUsed?: string;
}

export const createMeetingRoomColumns = (handlers: {
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}): ColumnDef<MeetingRoom>[] => [
    {
        key: "roomCode",
        header: "Mã phòng",
        className: "font-bold text-gray-900",
    },
    {
        key: "name",
        header: "Tên phòng họp",
        render: (row) => (
            <div className="flex flex-col">
                <span className="font-medium text-gray-900">{row.name}</span>
                <span className="text-xs text-gray-500">{row.address}</span>
            </div>
        ),
    },
    {
        key: "capacity",
        header: "Sức chứa",
        render: (row) => (
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{row.capacity} người</span>
            </div>
        ),
    },
    {
        key: "isActive",
        header: "Trạng thái",
        render: (row) => {
            const isActive = row.isActive;
            return (
                <Badge 
                    variant={isActive ? "success" : "secondary"}
                    className="rounded-lg px-2.5 py-0.5"
                >
                    {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                </Badge>
            );
        },
    },

];

export const createMeetingRoomRowActions = (handlers: {
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    isSuperAdmin: boolean;
}) => [
    {
        key: 'view',
        label: 'Xem chi tiết',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ),
        variant: 'primary' as const,
        onClick: (row: MeetingRoom) => handlers.onView(row.id)
    },
    {
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
        variant: 'warning' as const,
        onClick: (row: MeetingRoom) => handlers.onEdit(row.id),
        show: (row: MeetingRoom) => handlers.isSuperAdmin || row.departmentId !== null
    },
    {
        key: 'delete',
        label: 'Xóa',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
        variant: 'danger' as const,
        onClick: (row: MeetingRoom) => handlers.onDelete(row.id),
        show: (row: MeetingRoom) => handlers.isSuperAdmin || row.departmentId !== null
    }
];
