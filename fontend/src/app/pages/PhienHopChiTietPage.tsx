import {
    ArrowLeft,
    Clock,
    Download,
    FileText,
    MapPin,
    Upload,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../components/layout/PageHeader";
import { Sidebar } from "../components/layout/Sidebar";
import { CollapsibleSection } from "../components/meeting/CollapsibleSection";
import { ConfirmActionModal } from "../components/meeting/ConfirmActionModal";
import {
    PostponeData,
    PostponeModal,
} from "../components/meeting/PostponeModal";
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/common/ui/Button';
import { Card  } from '@/app/components/ui/card';

import { PHIEN_HOP_SIDEBAR_ITEMS } from "../constants/sidebar";
export default function PhienHopChiTietPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    // Lấy status từ mock data dựa trên ID
    const getMeetingStatus = (meetingId: string | undefined) => {
        if (!meetingId) return "Đang diễn ra";
        const finishedIds = ["3", "7", "10"]; // IDs của phiên họp đã kết thúc
        const draftIds = ["31", "32"]; // IDs của phiên họp nháp
        if (finishedIds.includes(meetingId)) return "Đã kết thúc";
        if (draftIds.includes(meetingId)) return "Nháp";
        return "Đang diễn ra";
    };

    // Tab cho Danh sách đăng ký phát biểu
    const [activeTab, setActiveTab] = useState<"cho" | "bac-bo">("cho");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [status, setStatus] = useState(getMeetingStatus(id));
    const [isPostponeOpen, setIsPostponeOpen] = useState(false);

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

    return (
        <>
            <div className="p-8">
                <PageHeader
                    title={
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/phien-hop")}
                                className="text-gray-600 hover:text-[#C8102E] hover:bg-red-50 px-2 py-2 h-auto"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <span>Thông tin phiên họp</span>
                        </div>
                    }
                    description="Chi tiết thông tin và quản lý phiên họp"
                    breadcrumbs={[
                        { name: "Trang chủ", path: "/" },
                        { name: "Phiên họp", path: "/phien-hop" },
                        { name: "Chi tiết phiên họp" },
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-[#C8102E] text-[#C8102E] hover:bg-red-50"
                                onClick={() =>
                                    navigate(`/phien-hop/${id}/cap-nhat`)
                                }
                            >
                                Cập nhật
                            </Button>
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
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 uppercase">
                                        HỌP TRIỂN KHAI KẾ HOẠCH QUÝ II/2026
                                    </h2>
                                    <div className="flex items-center justify-center gap-6 text-gray-600 text-[14px]">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>
                                                17/04/2026 22:31 - 23:20
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>Phòng họp 1 demo</span>
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
                                            <span className="text-gray-500 text-[14px] font-medium w-1/2">
                                                Chủ trì:
                                            </span>
                                            <span className="text-gray-900 font-medium w-1/2">
                                                Ông Trần Văn A - Bí thư
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] font-medium w-1/2">
                                                Địa điểm họp:
                                            </span>
                                            <span className="text-gray-900 font-medium w-1/2">
                                                Phòng họp 1 demo
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] font-medium w-1/2">
                                                Giấy mời họp:
                                            </span>
                                            <span className="text-gray-900 w-1/2">
                                                -
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] font-medium w-1/2">
                                                Kết luận phiên họp:
                                            </span>
                                            <span className="text-gray-900 w-1/2">
                                                -
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] font-medium w-1/2">
                                                Người chuẩn bị tài liệu:
                                            </span>
                                            <span className="text-gray-900 font-medium w-1/2">
                                                Nguyễn Văn B
                                            </span>
                                        </div>
                                    </div>

                                    {/* Cột phải */}
                                    <div className="space-y-4">
                                        {status !== "Đã kết thúc" &&
                                            status !== "Nháp" && (
                                                <div className="flex items-start justify-between">
                                                    <span className="text-gray-500 text-[14px] font-medium w-1/2">
                                                        Thời gian còn lại:
                                                    </span>
                                                    <span className="text-[#C8102E] font-bold w-1/2">
                                                        45 phút 12 giây
                                                    </span>
                                                </div>
                                            )}
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] font-medium w-1/2">
                                                Thành phần tham gia:
                                            </span>
                                            <button className="text-blue-600 hover:text-blue-800 underline w-1/2 text-left text-[14px] font-medium focus:outline-none">
                                                Xem thành phần tham gia
                                            </button>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] font-medium w-1/2">
                                                Chương trình họp:
                                            </span>
                                            <span className="text-gray-900 w-1/2">
                                                -
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] font-medium w-1/2">
                                                Trạng thái phiên họp:
                                            </span>
                                            <div className="w-1/2">
                                                <Badge
                                                    className={
                                                        status ===
                                                        "Đang diễn ra"
                                                            ? "bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none"
                                                            : status === "Nháp"
                                                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 px-3 py-1 text-xs rounded-full border-none"
                                                              : "bg-gray-100 text-gray-700 hover:bg-gray-100 px-3 py-1 text-xs rounded-full border-none"
                                                    }
                                                >
                                                    {status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-500 text-[14px] font-medium w-1/2">
                                                Người duyệt tài liệu:
                                            </span>
                                            <span className="text-gray-900 font-medium w-1/2">
                                                Trần Văn C
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* 3. Danh sách tài liệu */}
                        <CollapsibleSection title="Danh sách tài liệu">
                            <div className="space-y-3 px-2">
                                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#C8102E]">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                Báo cáo tình hình kinh tế - xã
                                                hội Quý 1.pdf
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                2.4 MB • Tải lên lúc 08:30 17/04
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-500 hover:text-[#C8102E]"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                Kế hoạch triển khai Quý 2 chi
                                                tiết.docx
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                1.1 MB • Tải lên lúc 08:45 17/04
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-500 hover:text-[#C8102E]"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* 4. Danh sách vấn đề cần biểu quyết (0) */}
                        <CollapsibleSection title="Danh sách vấn đề cần biểu quyết (0)">
                            <div className="min-h-[200px] flex flex-col">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="py-3 px-4 font-semibold text-gray-600 w-16 text-center">
                                                STT
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600">
                                                Vấn đề
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600 w-40">
                                                Trạng thái
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600 w-32 text-center">
                                                Hành động
                                            </th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400">
                                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Không có dữ liệu</p>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* 5. Danh sách đăng ký phát biểu (0) */}
                        <CollapsibleSection title="Danh sách đăng ký phát biểu (0)">
                            {/* Tabs */}
                            <div className="flex items-center gap-6 border-b border-gray-200 mb-4 px-2">
                                <button
                                    onClick={() => setActiveTab("cho")}
                                    className={`pb-3 font-medium text-[15px] border-b-2 transition-colors ${
                                        activeTab === "cho"
                                            ? "border-[#C8102E] text-[#C8102E]"
                                            : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    Chờ phát biểu
                                </button>
                                <button
                                    onClick={() => setActiveTab("bac-bo")}
                                    className={`pb-3 font-medium text-[15px] border-b-2 transition-colors ${
                                        activeTab === "bac-bo"
                                            ? "border-[#C8102E] text-[#C8102E]"
                                            : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    Bác bỏ
                                </button>
                            </div>

                            <div className="min-h-[200px] flex flex-col">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="py-3 px-4 font-semibold text-gray-600 w-16 text-center">
                                                STT
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600">
                                                Tên đại biểu
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600">
                                                Chức vụ
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600">
                                                Ghi chú
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600">
                                                Thời gian bắt đầu phát biểu
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600">
                                                Trạng thái
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600 w-32 text-center">
                                                Hành động
                                            </th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400">
                                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Không có dữ liệu</p>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* 6. Danh sách tham gia góp ý (0) */}
                        <CollapsibleSection
                            title="Danh sách tham gia góp ý (0) (Người góp ý: 0/2)"
                            action={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 border-gray-200 text-gray-600"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">
                                        Tải xuống
                                    </span>
                                </Button>
                            }
                        >
                            <div className="min-h-[200px] flex flex-col">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="py-3 px-4 font-semibold text-gray-600 w-16 text-center">
                                                STT
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600">
                                                Tên đại biểu
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600">
                                                Chức vụ
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600">
                                                Chi tiết góp ý
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600 w-32 text-center">
                                                Hành động
                                            </th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400">
                                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Không có dữ liệu</p>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Footer Actions */}
                        <div className="p-6 bg-gray-50/50 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100">
                            <Button
                                variant="outline"
                                className="border-[#C8102E] text-[#C8102E] hover:bg-red-50 font-medium rounded-full px-5 h-[42px]"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Tải lên kết luận sau phiên họp
                            </Button>

                            <Button
                                variant="outline"
                                className="border-[#C8102E] text-[#C8102E] hover:bg-red-50 font-medium rounded-full px-5 h-[42px]"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Tải xuống báo cáo tổng hợp phiên họp
                            </Button>

                            {status === "Sắp diễn ra" && (
                                <Button
                                    variant="outline"
                                    className="border-amber-600 text-amber-600 hover:bg-amber-50 font-medium rounded-full px-6 h-[42px]"
                                    onClick={() => setIsPostponeOpen(true)}
                                >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Hoãn phiên họp
                                </Button>
                            )}

                            {status !== "Đã kết thúc" && status !== "Nháp" && (
                                <Button
                                    variant="primary"
                                    className="bg-[#C8102E] hover:bg-[#a80d26] font-medium rounded-full px-6 h-[42px]"
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
        </>
    );
}
