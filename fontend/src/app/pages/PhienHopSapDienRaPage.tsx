import {
    ArrowLeft,
    Check,
    ChevronDown,
    Clock,
    Download,
    Eye,
    FileText,
    MapPin,
    MessageSquarePlus,
    MoreVertical,
    Play,
    Upload,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../components/layout/PageHeader";
import { Sidebar } from "../components/layout/Sidebar";
import { CollapsibleSection } from "../components/meeting/CollapsibleSection";
import { ConfirmAttendanceModal } from "../components/meeting/ConfirmAttendanceModal";
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/common/ui/Button';
import { Card, CardContent  } from '@/app/components/ui/card';

import { PHIEN_HOP_SIDEBAR_ITEMS } from "../constants/sidebar";
export default function PhienHopSapDienRaPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState<"cho" | "bac-bo">("cho");
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

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
            console.log("Đã xác nhận tham gia");
            alert("Đã xác nhận tham gia phiên họp");
        } else {
            console.log("Đã báo vắng:", data);
            if (data?.isFullSession) {
                alert(
                    `Đã gửi thông báo vắng toàn phiên\nLý do: ${data.reason}`,
                );
            } else {
                alert(
                    `Đã gửi thông báo vắng mặt\nLý do: ${data?.reason}\nSố nội dung vắng: ${data?.contentIds.length}`,
                );
            }
        }
    };

    // Mock data cho nội dung họp
    const meetingContents = [
        {
            id: 1,
            title: "Nội dung 1: Báo cáo tình hình kinh tế - xã hội Quý 1/2026",
            description:
                "Trình bày tổng quan tình hình phát triển kinh tế - xã hội, đánh giá kết quả đạt được và những hạn chế còn tồn tại trong quý I năm 2026.",
            preparedBy: "Nguyễn Văn B",
            approvedBy: "Trần Văn C",
            duration: "45 phút",
            status: "Chưa họp",
            documents: [
                { name: "Báo cáo tình hình KT-XH Q1.pdf", size: "2.4 MB" },
                { name: "Slide thuyết trình.pptx", size: "5.1 MB" },
            ],
        },
        {
            id: 2,
            title: "Nội dung 2: Kế hoạch triển khai Quý II/2026",
            description:
                "Trình bày chi tiết kế hoạch các nhiệm vụ trọng tâm, dự án ưu tiên và phân công trách nhiệm cho quý II năm 2026.",
            preparedBy: "Lê Thị D",
            approvedBy: "Phạm Văn E",
            duration: "60 phút",
            status: "Chưa họp",
            documents: [
                { name: "Kế hoạch Q2 chi tiết.docx", size: "1.1 MB" },
                { name: "Phân công nhiệm vụ.xlsx", size: "0.8 MB" },
            ],
        },
    ];

    // Mock data cho vấn đề biểu quyết
    const votingIssues = [
        {
            id: 1,
            content: "Nội dung 1",
            issue: "Phê duyệt Đề án phát triển hạ tầng giao thông khu vực phía Nam thành phố giai đoạn 2026-2030",
            status: "Chưa biểu quyết",
        },
        {
            id: 2,
            content: "Nội dung 1",
            issue: "Thông qua phương án điều chỉnh quy hoạch sử dụng đất năm 2026",
            status: "Chưa biểu quyết",
        },
        {
            id: 3,
            content: "Nội dung 2",
            issue: "Phê duyệt chủ trương đầu tư Dự án Trung tâm hành chính công tập trung",
            status: "Chưa biểu quyết",
        },
    ];

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
                        <Button
                            variant="primary"
                            className="bg-[#C8102E] hover:bg-[#a80d26]"
                            onClick={() => setIsAttendanceModalOpen(true)}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Xác nhận tham gia
                        </Button>
                    }
                />

                <div className="space-y-6">
                    <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Thông tin tổng quan */}
                        <CollapsibleSection
                            title={
                                <div className="w-full text-center py-2">
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 uppercase">
                                        TEST HIỆU NĂNG RUN70A12DA
                                    </h2>
                                    <div className="flex items-center justify-center gap-6 text-gray-600 text-[14px]">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>
                                                Thời gian: 25/04/2026 14:00 -
                                                16:00
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>Phòng họp: -</span>
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
                                                -
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
                                    </div>

                                    {/* Cột phải */}
                                    <div className="space-y-4">
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
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-3 py-1 text-xs rounded-full border-none">
                                                    Sắp diễn ra
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Nội dung họp */}
                        <CollapsibleSection
                            title={`Nội dung họp (${meetingContents.length})`}
                        >
                            <div className="space-y-6 px-2">
                                {meetingContents.map((content) => (
                                    <Card
                                        key={content.id}
                                        className="border border-gray-200 rounded-xl overflow-hidden"
                                    >
                                        <CardContent className="p-6">
                                            {/* Header nội dung */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-base font-bold text-gray-900 mb-2">
                                                        {content.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mb-4">
                                                        {content.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-[#C8102E] text-[#C8102E] hover:bg-red-50"
                                                    >
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Phê duyệt
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="bg-[#C8102E] hover:bg-[#a80d26]"
                                                    >
                                                        <Play className="w-4 h-4 mr-1" />
                                                        Bắt đầu
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="bg-[#C8102E] hover:bg-[#a80d26]"
                                                    >
                                                        <MessageSquarePlus className="w-4 h-4 mr-1" />
                                                        Thêm góp ý
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Chi tiết nội dung */}
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4 text-sm">
                                                <div className="flex items-start">
                                                    <span className="text-gray-500 font-medium mr-2">
                                                        Người chuẩn bị tài liệu:
                                                    </span>
                                                    <span className="text-gray-900 font-medium">
                                                        {content.preparedBy}
                                                    </span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="text-gray-500 font-medium mr-2">
                                                        Người duyệt tài liệu:
                                                    </span>
                                                    <span className="text-gray-900 font-medium">
                                                        {content.approvedBy}
                                                    </span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="text-gray-500 font-medium mr-2">
                                                        Thành phần tham gia:
                                                    </span>
                                                    <button className="text-blue-600 hover:text-blue-800 underline text-sm font-medium focus:outline-none">
                                                        Xem thành phần tham gia
                                                    </button>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="text-gray-500 font-medium mr-2">
                                                        Thời gian nội dung:
                                                    </span>
                                                    <span className="text-gray-900">
                                                        {content.duration}
                                                    </span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="text-gray-500 font-medium mr-2">
                                                        Trạng thái nội dung:
                                                    </span>
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1 text-xs rounded-full border-none">
                                                        {content.status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Danh sách tài liệu */}
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-3">
                                                    Danh sách tài liệu:
                                                </p>
                                                <div className="space-y-2">
                                                    {content.documents.map(
                                                        (doc, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-[#C8102E]">
                                                                        <FileText className="w-4 h-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900 text-sm">
                                                                            {
                                                                                doc.name
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {
                                                                                doc.size
                                                                            }
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
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CollapsibleSection>

                        {/* Danh sách vấn đề cần biểu quyết */}
                        <CollapsibleSection
                            title={`Danh sách vấn đề cần biểu quyết (${votingIssues.length})`}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="py-3 px-4 font-semibold text-gray-600 w-16 text-center">
                                                STT
                                            </th>
                                            <th className="py-3 px-4 font-semibold text-gray-600 w-32">
                                                Nội dung
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
                                    <tbody>
                                        {votingIssues.map((issue, index) => (
                                            <tr
                                                key={issue.id}
                                                className="border-b border-gray-100 hover:bg-gray-50"
                                            >
                                                <td className="py-3 px-4 text-center text-gray-700">
                                                    {index + 1}
                                                </td>
                                                <td className="py-3 px-4 text-gray-700">
                                                    {issue.content}
                                                </td>
                                                <td className="py-3 px-4 text-gray-900">
                                                    {issue.issue}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1 text-xs rounded-full border-none">
                                                        {issue.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-gray-500 hover:text-[#C8102E]"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-gray-500 hover:text-[#C8102E]"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-end gap-2 mt-4 px-2">
                                <span className="text-sm text-gray-600">
                                    1-{votingIssues.length} của{" "}
                                    {votingIssues.length}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled
                                    >
                                        <ChevronDown className="h-4 w-4 rotate-90" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled
                                    >
                                        <ChevronDown className="h-4 w-4 -rotate-90" />
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Danh sách đăng ký phát biểu */}
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
                                                Nội dung đăng ký
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

                        {/* Danh sách tham gia góp ý */}
                        <CollapsibleSection
                            title="Danh sách tham gia góp ý (0) (Người góp ý: 0/4)"
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
                                                Góp ý cho nội dung
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
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal xác nhận tham gia */}
            <ConfirmAttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                onConfirm={handleConfirmAttendance}
            />
        </>
    );
}
