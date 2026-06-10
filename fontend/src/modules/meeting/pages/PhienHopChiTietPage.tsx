import { ArrowLeft, Check, Clock, Download, Eye, FileText, MapPin, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from '@/common/components/layout/PageHeader';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';
import { ConfirmActionModal } from '@/modules/meeting/components/ConfirmActionModal';
import { PostponeData, PostponeModal } from '@/modules/meeting/components/PostponeModal';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { Card } from '@/common/components/ui/card';
import { ManageParticipantsModal } from '@/modules/meeting/components/ManageParticipantsModal';
import { ConfirmAttendanceModal } from '@/modules/meeting/components/ConfirmAttendanceModal';
import { ThanhPhanThamDuData } from '@/modules/meeting/components/ThanhPhanThamDuStep';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { TableEngineConfig } from '@/common/components/table-engine/table.types';
import { getMeetingStatus, MOCK_VOTING_ISSUES, MOCK_PARTICIPANTS, VotingIssue, Speaker, Participant, Opinion } from '../meeting.mock';
import { cn } from '@/common/utils/cn';
import { meetingApi, MeetingResponse } from '../services/meeting.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/common/components/ui/dialog';

const mapMeetingStatusVi = (statusStr: string): string => {
    switch (statusStr) {
        case 'DRAFT': return 'Nháp';
        case 'PENDING_APPROVAL': return 'Chờ phê duyệt';
        case 'APPROVED': return 'Đã phê duyệt';
        case 'UPCOMING': return 'Sắp diễn ra';
        case 'IN_PROGRESS': return 'Đang diễn ra';
        case 'CLOSED': return 'Đã kết thúc';
        case 'CANCELLED': return 'Đã hủy';
        case 'REJECTED': return 'Bị từ chối';
        case 'EXPIRED': return 'Đã hết hạn';
        default: return statusStr;
    }
};

export default function PhienHopChiTietPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [meetingDetail, setMeetingDetail] = useState<MeetingResponse | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [opinions, setOpinions] = useState<any[]>([]);
    const [motions, setMotions] = useState<any[]>([]);
    const [waitingSpeakers, setWaitingSpeakers] = useState<any[]>([]);
    const [rejectedSpeakers, setRejectedSpeakers] = useState<any[]>([]);




    // Tab cho Danh sách đăng ký phát biểu
    const [activeTab, setActiveTab] = useState<"cho" | "bac-bo">("cho");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [status, setStatus] = useState(getMeetingStatus(id));
    const [isPostponeOpen, setIsPostponeOpen] = useState(false);
    const [isManageParticipantsOpen, setIsManageParticipantsOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [participantsData, setParticipantsData] = useState<ThanhPhanThamDuData>({
        donVi: [],
        caNhan: [],
        nhomThanhVien: [],
        khachMoi: [],
        chuTriId: null
    });

    // Table configs
    const votingTableConfig: TableEngineConfig<any> = {
        columns: [
            { key: 'title', header: 'Vấn đề' },
            { 
                key: 'status', 
                header: 'Trạng thái', 
                width: '160px',
                render: (row: any) => {
                    const isPending = row.status === 'DRAFT';
                    return (
                        <Badge className={cn(
                            "px-3 py-1 text-xs rounded-full border-none",
                            isPending ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                        )}>
                            {isPending ? 'Chưa biểu quyết' : 'Đã hoàn thành'}
                        </Badge>
                    );
                }
            }
        ]
    };

    const speakerTableConfig: TableEngineConfig<any> = {
        columns: [
            { key: 'userName', header: 'Tên đại biểu' },
            { key: 'position', header: 'Chức vụ', render: () => '-' },
            { key: 'priority', header: 'Độ ưu tiên', render: (row: any) => row.priority || '-' },
            { key: 'requestedAt', header: 'Thời gian yêu cầu', render: (row: any) => row.requestedAt ? new Date(row.requestedAt).toLocaleTimeString("vi-VN") : '-' },
            { 
                key: 'queueStatus', 
                header: 'Trạng thái',
                render: (row: any) => (
                    <Badge className={cn(
                        "px-3 py-1 text-xs rounded-full border-none",
                        row.queueStatus === 'QUEUED' ? "bg-amber-100 text-amber-700" :
                        row.queueStatus === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                    )}>
                        {row.queueStatus === 'QUEUED' ? 'Chờ phát biểu' : row.queueStatus === 'REJECTED' ? 'Bác bỏ' : row.queueStatus}
                    </Badge>
                )
            }
        ]
    };

    // Cập nhật dữ liệu khi ID thay đổi
    useEffect(() => {
        if (id) {
            // 1. Fetch meeting info
            meetingApi.getMeetingById(id).then(res => {
                if (res.success && res.data) {
                    setMeetingDetail(res.data);
                    setStatus(mapMeetingStatusVi(res.data.status));
                }
            });
            // 2. Fetch documents
            meetingApi.getMeetingDocuments(id).then(res => {
                if (res.success && res.data) {
                    setDocuments(res.data);
                }
            });
            // 3. Fetch opinions
            meetingApi.getOpinions(id).then(res => {
                if (res.success && res.data) {
                    setOpinions(res.data);
                }
            });
            // 4. Fetch motions
            meetingApi.getMeetingMotions(id).then(res => {
                if (res.success && res.data) {
                    setMotions(res.data);
                }
            });
            // 5. Fetch waiting speakers
            meetingApi.getSpeakersQueue(id, 'QUEUED').then(res => {
                if (res.success && res.data) {
                    setWaitingSpeakers(res.data);
                }
            });
            // 6. Fetch rejected speakers
            meetingApi.getSpeakersQueue(id, 'REJECTED').then(res => {
                if (res.success && res.data) {
                    setRejectedSpeakers(res.data);
                }
            });

            // Giả lập dữ liệu thành viên dựa trên ID
            setParticipantsData({
                donVi: [
                    { id: 'u1', name: 'Nguyễn Văn A', position: 'Trưởng phòng', unit: 'Phòng Hành chính', unitId: 'unit1', email: 'a@hcm.gov.vn' }
                ],
                caNhan: [],
                nhomThanhVien: [],
                khachMoi: [
                    { id: 'k1', name: 'Ông Nguyễn Văn X', position: 'Giám đốc', unit: 'Công ty ABC', email: 'x@abc.com', phone: '0987654321' },
                    { id: 'k2', name: 'Bà Trần Thị Y', position: 'Phó Giám đốc', unit: 'Công ty XYZ', email: 'y@xyz.com', phone: '0987654322' }
                ],
                chuTriId: 'u1'
            });
        }
    }, [id]);

    // Xử lý nút Kết thúc
    const handleConfirmEnd = () => {
        // Đổi trạng thái phiên họp thành "Đã kết thúc"
        setStatus("Đã kết thúc");
        setIsConfirmOpen(false);
    };

    // Xử lý nút Hoãn
    const handleConfirmPostpone = (data: PostponeData) => {
        console.log("Postpone meeting:", id, data);

        // Gọi API hoãn phiên họp
        // API sẽ nhận:
        // - meetingId: id
        // - newStartTime: data.newStartTime
        // - newEndTime: data.newEndTime
        // - reason: data.reason

        alert(
            `Đã hoãn phiên họp thành công!\nThời gian mới: ${data.newStartTime} - ${data.newEndTime}\nLý do: ${data.reason}`,
        );

        // Đóng modal
        setIsPostponeOpen(false);

        // TODO: Reload meeting detail sau khi hoãn thành công
        // hoặc cập nhật lại UI với thông tin mới
    };

    // Xử lý xác nhận tham gia
    const handleConfirmAttendance = (
        attendance: "attend" | "absent",
        data?: {
            isFullSession: boolean;
            reason: string;
            contentIds: string[];
            substituteId?: string;
        },
    ) => {
        if (attendance === "attend") {
            alert("Đã xác nhận tham gia phiên họp");
        } else {
            if (data?.isFullSession) {
                alert(`Đã gửi thông báo vắng toàn phiên\nLý do: ${data.reason}`);
            } else {
                alert(`Đã gửi thông báo vắng mặt\nLý do: ${data?.reason}`);
            }
        }
        setIsAttendanceModalOpen(false);
    };

    return (
        <>
            <ManageParticipantsModal
                isOpen={isManageParticipantsOpen}
                onClose={() => setIsManageParticipantsOpen(false)}
                initialData={participantsData}
                readOnly={true}
            />
            <div className="p-8">
                <PageHeader
                    title={
                        <button
                            onClick={() => navigate("/phien-hop")}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm body">
                                Quay lại
                            </span>
                        </button>
                    }
                    breadcrumbs={[
                        { name: "Trang chủ", path: "/" },
                        { name: "Phiên họp", path: "/phien-hop" },
                        { name: "Chi tiết phiên họp" },
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            {status === "Sắp diễn ra" && (
                                <Button
                                    variant="primary"
                                    className="bg-[#C8102E] hover:bg-[#a80d26]"
                                    onClick={() => setIsAttendanceModalOpen(true)}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Xác nhận tham gia
                                </Button>
                            )}
                            {status !== "Đã kết thúc" && status !== "Đang diễn ra" && (
                                <Button
                                    variant="outline"
                                    className="border-[#C8102E] text-[#C8102E] hover:bg-red-50"
                                    onClick={() =>
                                        navigate(`/phien-hop/${id}/cap-nhat`)
                                    }
                                >
                                    Cập nhật
                                </Button>
                            )}
                            {status !== "Đã kết thúc" && status !== "Nháp" && (
                                <Button
                                    variant="primary"
                                    className="bg-[#C8102E] hover:bg-[#a80d26]"
                                    onClick={() =>
                                        navigate(`/phien-hop/${id}/dien-bien`)
                                    }
                                >
                                    Xem diễn biến
                                </Button>
                            )}
                        </div>
                    }
                />

                <div className="space-y-6">
                    <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* 1. Thông tin tổng quan (Tiêu đề + Meta + Collapse cho Section 2) */}
                        <CollapsibleSection
                            title={
                                <div className="w-full text-center py-2">
                                    <h2 className="text-xl md:text-2xl heading text-gray-900 mb-2 uppercase">
                                        {meetingDetail?.title || "CHI TIẾT PHIÊN HỌP"}
                                    </h2>
                                    <div className="flex items-center justify-center gap-6 text-gray-600 text-[14px]">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>
                                                {meetingDetail ? `${new Date(meetingDetail.startTime).toLocaleString("vi-VN")} - ${new Date(meetingDetail.endTime).toLocaleString("vi-VN")}` : ""}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>{meetingDetail?.locationName || "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            }
                            className="border-b border-gray-100"
                            headerClassName="px-4 md:px-6 py-4 bg-white"
                        >
                            <div className="px-2 md:px-6 pt-2 pb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                                    {/* Cột trái */}
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] body w-1/2">
                                                Chủ trì:
                                            </span>
                                            <span className="text-gray-900 body w-1/2">
                                                {meetingDetail?.chairName || "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] body w-1/2">
                                                Địa điểm họp:
                                            </span>
                                            <span className="text-gray-900 body w-1/2">
                                                {meetingDetail?.locationName || "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] body w-1/2">
                                                Giấy mời họp:
                                            </span>
                                            <span className="text-gray-900 w-1/2">
                                                {meetingDetail?.agendaFile ? (
                                                    <a href={meetingDetail.agendaFile.url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                                        {meetingDetail.agendaFile.name}
                                                    </a>
                                                ) : "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] body w-1/2">
                                                Kết luận phiên họp:
                                            </span>
                                            <span className="text-gray-900 w-1/2">
                                                -
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] body w-1/2">
                                                Người chuẩn bị tài liệu:
                                            </span>
                                            <span className="text-gray-900 body w-1/2">
                                                {meetingDetail?.createdByName || "-"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Cột phải */}
                                    <div className="space-y-4">
                                        {status !== "Đã kết thúc" &&
                                            status !== "Nháp" && (
                                                <div className="flex items-start justify-between">
                                                    <span className="text-gray-500 text-[14px] body w-1/2">
                                                        Thời gian còn lại:
                                                    </span>
                                                    <span className="text-[#C8102E] heading w-1/2">
                                                        45 phút 12 giây
                                                    </span>
                                                </div>
                                            )}
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] body w-1/2">
                                                Thành phần tham gia:
                                            </span>
                                            <div className="flex flex-col gap-2 w-1/2">
                                                <div 
                                                    onClick={() => {
                                                        console.log("CLICKED PARTICIPANTS BUTTON");
                                                        setIsManageParticipantsOpen(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 underline text-left text-[14px] body cursor-pointer py-1 inline-block"
                                                >
                                                    Xem thành phần tham gia
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] body w-1/2">
                                                Chương trình họp:
                                            </span>
                                            <span className="text-gray-900 w-1/2">
                                                -
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] body w-1/2">
                                                Trạng thái phiên họp:
                                            </span>
                                            <div className="w-1/2">
                                                <Badge
                                                    className={
                                                        status === "Đang diễn ra"
                                                            ? "bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none"
                                                            : status === "Nháp"
                                                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 px-3 py-1 text-xs rounded-full border-none"
                                                              : status === "Sắp diễn ra"
                                                                ? "bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1 text-xs rounded-full border-none"
                                                                : "bg-gray-100 text-gray-700 hover:bg-gray-100 px-3 py-1 text-xs rounded-full border-none"
                                                    }
                                                >
                                                    {status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] body w-1/2">
                                                Đơn vị tổ chức:
                                            </span>
                                            <span className="text-gray-900 body w-1/2">
                                                {meetingDetail?.departmentName || "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* 3. Danh sách tài liệu */}
                        <CollapsibleSection title={`Danh sách tài liệu (${documents.length})`} defaultExpanded={false}>
                            <div className="space-y-3 px-2">
                                {documents.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">Chưa có tài liệu nào.</p>
                                ) : (
                                    documents.map((doc: any) => {
                                        const isPdf = doc.fileName?.toLowerCase().endsWith(".pdf") || doc.title?.toLowerCase().endsWith(".pdf") || doc.fileUrl?.toLowerCase().endsWith(".pdf");
                                        return (
                                            <div key={doc.id || doc.documentId} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#C8102E]">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="body text-gray-900 text-sm">
                                                            {doc.title || doc.fileName || "Tài liệu"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : "Chưa rõ kích thước"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isPdf && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-gray-500 hover:text-[#C8102E]"
                                                            onClick={() => {
                                                                if (doc.fileUrl) {
                                                                    window.open(doc.fileUrl, "_blank");
                                                                }
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-500 hover:text-[#C8102E]"
                                                        onClick={() => {
                                                            if (doc.fileUrl) {
                                                                window.open(doc.fileUrl, "_blank");
                                                            }
                                                        }}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CollapsibleSection>

                        {/* 4. Danh sách vấn đề cần biểu quyết */}
                        <CollapsibleSection title={`Danh sách vấn đề cần biểu quyết (${motions.length})`} defaultExpanded={false}>
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

                        {/* 5. Danh sách đăng ký phát biểu */}
                        <CollapsibleSection title={`Danh sách đăng ký phát biểu (${waitingSpeakers.length + rejectedSpeakers.length})`} defaultExpanded={false}>
                            <div className="p-0">
                                {/* Tabs */}
                                <div className="flex items-center gap-6 border-b border-gray-200 mb-4 px-6 pt-4">
                                    <button
                                        onClick={() => setActiveTab("cho")}
                                        className={`pb-3 body text-[15px] border-b-2 transition-colors ${
                                            activeTab === "cho"
                                                ? "border-[#C8102E] text-[#C8102E]"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        Chờ phát biểu ({waitingSpeakers.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("bac-bo")}
                                        className={`pb-3 body text-[15px] border-b-2 transition-colors ${
                                            activeTab === "bac-bo"
                                                ? "border-[#C8102E] text-[#C8102E]"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        Bác bỏ ({rejectedSpeakers.length})
                                    </button>
                                </div>

                                <div className="min-h-[200px]">
                                    <DataTable 
                                        data={activeTab === "cho" ? waitingSpeakers : rejectedSpeakers} 
                                        config={speakerTableConfig}
                                        pageSize={5}
                                        totalItems={activeTab === "cho" ? waitingSpeakers.length : rejectedSpeakers.length}
                                        onPageChange={() => {}}
                                    />
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* 6. Danh sách tham gia góp ý */}
                        <CollapsibleSection
                            title={`Danh sách tham gia góp ý (${opinions.length})`}
                            defaultExpanded={false}
                        >
                            <div className="min-h-[200px]">
                                <DataTable 
                                    data={opinions} 
                                    config={{
                                        columns: [
                                            { key: 'delegateName', header: 'Tên đại biểu' },
                                            { key: 'positionName', header: 'Chức vụ', render: (row: any) => row.positionName || '-' },
                                            { key: 'opinionDetail', header: 'Chi tiết góp ý' },
                                            {
                                                key: 'documentName',
                                                header: 'Tài liệu góp ý',
                                                render: (row: any) => row.documentName || '-'
                                            },
                                            { 
                                                key: 'id', 
                                                header: 'Hành động', 
                                                width: '128px', 
                                                align: 'center',
                                                render: (row: any) => {
                                                    const hasAttachments = row.attachments && row.attachments.length > 0;
                                                    return (
                                                        <div className="flex justify-center gap-2">
                                                            {hasAttachments && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="text-gray-500 hover:text-[#C8102E]"
                                                                    onClick={() => {
                                                                        const attachment = row.attachments[0];
                                                                        if (attachment.fileUrl) {
                                                                            window.open(attachment.fileUrl, "_blank");
                                                                        }
                                                                    }}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            }
                                        ]
                                    }}
                                    pageSize={5}
                                    totalItems={opinions.length}
                                    onPageChange={() => {}}
                                />
                            </div>
                        </CollapsibleSection>

                        {/* Footer Actions */}
                        <div className="p-6 bg-gray-50/50 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100">
                            <Button
                                variant="outline"
                                className="border-[#C8102E] text-[#C8102E] hover:bg-red-50 body rounded-full px-5 h-[42px]"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Tải lên kết luận sau phiên họp
                            </Button>

                            <Button
                                variant="outline"
                                className="border-[#C8102E] text-[#C8102E] hover:bg-red-50 body rounded-full px-5 h-[42px]"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Tải xuống báo cáo tổng hợp phiên họp
                            </Button>

                            {status === "Sắp diễn ra" && (
                                <Button
                                    variant="outline"
                                    className="border-amber-600 text-amber-600 hover:bg-amber-50 body rounded-full px-6 h-[42px]"
                                    onClick={() => setIsPostponeOpen(true)}
                                >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Hoãn phiên họp
                                </Button>
                            )}

                            {status !== "Đã kết thúc" && status !== "Nháp" && (
                                <Button
                                    variant="primary"
                                    className="bg-[#C8102E] hover:bg-[#a80d26] body rounded-full px-6 h-[42px]"
                                    onClick={() => setIsConfirmOpen(true)}
                                >
                                    Kết thúc phiên họp
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmActionModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmEnd}
                actionType="end"
            />

            <PostponeModal
                isOpen={isPostponeOpen}
                onClose={() => setIsPostponeOpen(false)}
                onConfirm={handleConfirmPostpone}
                meetingId={id || ""}
                oldStartTime="2026-04-17T08:30"
                oldEndTime="2026-04-17T11:00"
            />
            <ConfirmAttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                onConfirm={handleConfirmAttendance}
            />


        </>
    );
}
