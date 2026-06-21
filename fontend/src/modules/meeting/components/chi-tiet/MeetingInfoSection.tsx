import React from 'react';
import { Card } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { AlertCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';
import { cn } from '@/common/utils/cn';

interface MeetingInfoSectionProps {
    meetingDetail: any;
    status: string;
    timeLeftStr: string;
    handleOpenParticipants: () => void;
    isGuest?: boolean;
}

export const MeetingInfoSection: React.FC<MeetingInfoSectionProps> = ({
    meetingDetail,
    status,
    timeLeftStr,
    handleOpenParticipants,
    isGuest,
}) => {
    return (
        <div className="space-y-6">
            {meetingDetail?.rejectReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-red-800">
                            Phiên họp bị từ chối duyệt
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                            <span className="font-medium">Lý do:</span> {meetingDetail.rejectReason}
                        </p>
                    </div>
                </div>
            )}
            {meetingDetail?.status === "CANCELLED" && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                            Phiên họp đã bị hủy
                        </h4>
                        {meetingDetail?.cancelReason && (
                            <p className="text-sm text-gray-700 mt-1">
                                <span className="font-medium">Lý do:</span> {meetingDetail.cancelReason}
                            </p>
                        )}
                    </div>
                </div>
            )}
            {meetingDetail?.status === "PENDING_APPROVAL" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-850">
                            Phiên họp đang chờ phê duyệt
                        </h4>
                        <p className="text-sm text-amber-700 mt-1">
                            Phiên họp đang được trình phê duyệt bởi người chủ trì hoặc quản trị viên.
                        </p>
                    </div>
                </div>
            )}

            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
                                        {meetingDetail
                                            ? `${new Date(meetingDetail.startTime).toLocaleString("vi-VN")} - ${new Date(meetingDetail.endTime).toLocaleString("vi-VN")}`
                                            : ""}
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
                                        Đơn vị tổ chức:
                                    </span>
                                    <span className="text-gray-900 body w-1/2">
                                        {meetingDetail?.departmentName || "-"}
                                    </span>
                                </div>
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
                            </div>

                            {/* Cột phải */}
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <span className="text-gray-500 text-[14px] body w-1/2">
                                        Trạng thái phiên họp:
                                    </span>
                                    <div className="w-1/2">
                                        <Badge
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full border-none font-medium hover:opacity-90",
                                                meetingDetail?.status === "IN_PROGRESS"
                                                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                                                    : meetingDetail?.status === "DRAFT"
                                                      ? "bg-yellow-105 text-yellow-750 hover:bg-yellow-105"
                                                      : meetingDetail?.status === "PENDING_APPROVAL"
                                                        ? "bg-orange-100 text-orange-700 hover:bg-orange-100"
                                                        : meetingDetail?.status === "APPROVED"
                                                          ? "bg-blue-105 text-blue-705 hover:bg-blue-105"
                                                          : meetingDetail?.status === "UPCOMING"
                                                            ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
                                                            : meetingDetail?.status === "CLOSED"
                                                              ? "bg-gray-105 text-gray-700 hover:bg-gray-105"
                                                              : meetingDetail?.status === "CANCELLED"
                                                                ? "bg-red-105 text-red-750 hover:bg-red-105"
                                                                : meetingDetail?.status === "REJECTED"
                                                                  ? "bg-red-200 text-red-800 hover:bg-red-200"
                                                                  : "bg-gray-105 text-gray-700",
                                            )}
                                        >
                                            {status}
                                        </Badge>
                                    </div>
                                </div>
                                {meetingDetail?.status === "IN_PROGRESS" && timeLeftStr && (
                                    <div className="flex items-start justify-between">
                                        <span className="text-gray-500 text-[14px] body w-1/2">
                                            Thời gian còn lại:
                                        </span>
                                        <span className="text-[#C8102E] heading w-1/2">
                                            {timeLeftStr}
                                        </span>
                                    </div>
                                )}
                                {!isGuest && (
                                    <div className="flex items-start justify-between">
                                        <span className="text-gray-500 text-[14px] body w-1/2">
                                            Thành phần tham gia:
                                        </span>
                                        <div className="flex flex-col gap-2 w-1/2">
                                            <div
                                                onClick={handleOpenParticipants}
                                                className="text-blue-600 hover:text-blue-800 underline text-left text-[14px] body cursor-pointer py-1 inline-block"
                                            >
                                                Xem thành phần tham gia
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start justify-between">
                                    <span className="text-gray-500 text-[14px] body w-1/2">
                                        Kết luận phiên họp:
                                    </span>
                                    <span className="text-gray-900 w-1/2">-</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>
            </Card>
        </div>
    );
};
