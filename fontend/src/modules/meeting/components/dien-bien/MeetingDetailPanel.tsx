import React from 'react';
import { useSearchParams } from 'react-router';
import { Card, CardContent } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { FileText, Download, CheckCircle, PlayCircle, MessageSquarePlus, Eye, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import { MeetingContent } from '../../meeting.mock';
import { downloadDocument, viewDocument } from '@/common/utils/fileHelpers';

interface MeetingDetailPanelProps {
    meetingContents: MeetingContent[];
    activeContent: string | number;
    onEndContent: (contentId: string | number) => void;
    onOpenStart: () => void;
    onOpenAddOpinionForContent: () => void;
    setSelectedContent: (content: MeetingContent | null) => void;
    setIsStartContentModalOpen: (open: boolean) => void;
    isGuest?: boolean;
    meetingStatus?: string;
    isChairOrSecretary?: boolean;
    isAttendee?: boolean;
    meeting?: any;
}

/**
 * Panel hiển thị chi tiết nội dung đang chọn, thông tin phiên họp,
 * tài liệu đính kèm, và các nút hành động.
 */
export function MeetingDetailPanel({
    meetingContents,
    activeContent,
    onEndContent,
    onOpenStart,
    onOpenAddOpinionForContent,
    setSelectedContent,
    setIsStartContentModalOpen,
    isGuest,
    meetingStatus,
    isChairOrSecretary = false,
    isAttendee = false,
    meeting,
}: MeetingDetailPanelProps) {
    const [searchParams] = useSearchParams();
    const guestToken = searchParams.get('guestToken');
    const currentContent = meetingContents.find((c) => c.id === activeContent);

    const formatTimeRange = (start?: string, end?: string) => {
        if (!start && !end) return "-";
        const formatTime = (timeStr?: string) => {
            if (!timeStr) return "";
            const date = new Date(timeStr);
            if (isNaN(date.getTime())) return "";
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${hours}:${minutes} ${day}/${month}/${year}`;
        };
        const sFormatted = formatTime(start);
        const eFormatted = formatTime(end);
        if (sFormatted && eFormatted) return `${sFormatted} - ${eFormatted}`;
        return sFormatted || eFormatted || "-";
    };

    const getDurationMinutes = (start?: string, end?: string) => {
        if (!start || !end) return null;
        const s = new Date(start);
        const e = new Date(end);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
        const diffMs = e.getTime() - s.getTime();
        return Math.max(0, Math.round(diffMs / 60000));
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case "IN_PROGRESS":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-3 py-1 text-xs rounded-full border-none">Đang tiến hành</Badge>;
            case "DONE":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">Hoàn thành</Badge>;
            case "SKIPPED":
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 px-3 py-1 text-xs rounded-full border-none">Bỏ qua</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 px-3 py-1 text-xs rounded-full border-none">Chưa bắt đầu</Badge>;
        }
    };

    const getFileIconStyle = (fileName?: string) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') {
            return {
                bg: 'bg-red-50',
                text: 'text-[#C8102E]',
                icon: FileText
            };
        }
        if (ext === 'doc' || ext === 'docx') {
            return {
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                icon: FileText
            };
        }
        if (ext === 'xls' || ext === 'xlsx') {
            return {
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                icon: FileSpreadsheet
            };
        }
        return {
            bg: 'bg-gray-50',
            text: 'text-gray-600',
            icon: FileIcon
        };
    };

    const formatSize = (bytes?: number) => {
        if (bytes === undefined || bytes === null) return "-";
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
            <CardContent className="p-5 space-y-6 flex-1 flex flex-col">
                {/* Nội dung đang được chọn */}
                <div>
                    <h3 className="text-base btn-primary text-gray-900 mb-4">
                        {currentContent?.title || "Chưa chọn nội dung"}
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                            {currentContent?.description || "Không có mô tả chi tiết."}
                        </p>
                    </div>
                </div>

                {/* Thông tin chi tiết */}
                {currentContent && currentContent.id !== "GENERAL_AGENDA" && (
                    <div>
                        <h3 className="text-base btn-primary text-gray-900 mb-4">
                            Thông tin chi tiết nội dung họp
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start justify-between">
                                <span className="text-gray-500 body">Người chuẩn bị:</span>
                                <span className="text-gray-900 body">{currentContent?.preparedByFullName || "-"}</span>
                            </div>
                            <div className="flex items-start justify-between">
                                <span className="text-gray-500 body">Trạng thái:</span>
                                {getStatusBadge(currentContent?.status)}
                            </div>
                            <div className="flex items-start justify-between">
                                <span className="text-gray-500 body">Thời lượng:</span>
                                <span className="text-gray-900 body">
                                    {getDurationMinutes(currentContent?.startTime, currentContent?.endTime) !== null
                                        ? `${getDurationMinutes(currentContent?.startTime, currentContent?.endTime)} phút`
                                        : (currentContent?.durationEst ? `${currentContent?.durationEst} phút` : "-")}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tài liệu chung / Chương trình họp */}
                {currentContent?.id === "GENERAL_AGENDA" && meeting?.agendaFile && (
                    <div>
                        <h3 className="text-base btn-primary text-gray-900 mb-4">
                            Tài liệu chung / Chương trình họp
                        </h3>
                        <div className="p-3 bg-red-50/40 border border-red-100 rounded-xl hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#C8102E]">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="body text-gray-900 text-sm font-semibold">
                                            {meeting.agendaFile.name || "Chương trình họp"}
                                        </p>
                                        <p className="text-xs text-gray-500">Tài liệu chương trình họp tổng quan</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 text-gray-500 hover:text-[#C8102E]"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            viewDocument(meeting.agendaFile.id, guestToken);
                                        }}
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 text-gray-500 hover:text-[#C8102E]"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            downloadDocument(meeting.agendaFile.id, meeting.agendaFile.name, guestToken);
                                        }}
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tài liệu đính kèm */}
                {currentContent && currentContent.id !== "GENERAL_AGENDA" && (
                    <div>
                        <h3 className="text-base btn-primary text-gray-900 mb-4">
                            Tài liệu đính kèm
                        </h3>
                        <div className="space-y-3">
                            {currentContent?.documents && currentContent.documents.length > 0 ? (
                                currentContent.documents.map((doc) => {
                                    const iconStyle = getFileIconStyle(doc.fileName);
                                    const FileIconComp = iconStyle.icon;
                                    const isPdf = doc.fileName?.toLowerCase().endsWith(".pdf") || doc.title?.toLowerCase().endsWith(".pdf");
                                    return (
                                        <div key={doc.documentId} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg ${iconStyle.bg} flex items-center justify-center ${iconStyle.text}`}>
                                                    <FileIconComp className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="body text-gray-900 text-sm">
                                                        {doc.title || doc.fileName}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                        <span>{formatSize(doc.fileSize)}</span>
                                                        {doc.createdByFullName && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Chuẩn bị bởi: {doc.createdByFullName}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {isPdf && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-7 h-7 text-gray-500 hover:text-[#C8102E]"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            viewDocument(doc.documentId, guestToken);
                                                        }}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-7 h-7 text-gray-500 hover:text-[#C8102E]"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        downloadDocument(doc.documentId, doc.fileName, guestToken);
                                                    }}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-gray-500 italic">Không có tài liệu đính kèm.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons for Content - chỉ hiển thị khi cuộc họp đang diễn ra và không phải khách mời */}
                {!isGuest && isAttendee && (
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        {meetingStatus === "IN_PROGRESS" ? (
                            currentContent ? (
                                currentContent.id === "GENERAL_AGENDA" ? (
                                    <p className="text-sm text-gray-500 italic">Chương trình họp chung chỉ dùng để tham khảo thông tin.</p>
                                ) : (
                                    <>
                                        {isChairOrSecretary && currentContent.status === "IN_PROGRESS" && (
                                            <button
                                                type="button"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    padding: "10px 20px",
                                                    border: "1px solid #C8102E",
                                                    borderRadius: "9999px",
                                                    background: "transparent",
                                                    color: "#C8102E",
                                                    fontWeight: "500",
                                                    cursor: "pointer",
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onEndContent(activeContent);
                                                }}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Kết thúc nội dung
                                            </button>
                                        )}

                                        {isChairOrSecretary && currentContent.status !== "IN_PROGRESS" && currentContent.status !== "DONE" && currentContent.status !== "SKIPPED" && (
                                            <button
                                                type="button"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    padding: "10px 20px",
                                                    border: "1px solid #2563eb",
                                                    borderRadius: "9999px",
                                                    background: "transparent",
                                                    color: "#2563eb",
                                                    fontWeight: "500",
                                                    cursor: "pointer",
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onOpenStart();
                                                }}
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                                Bắt đầu
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                padding: "10px 20px",
                                                border: "none",
                                                borderRadius: "9999px",
                                                background: "#C8102E",
                                                color: "white",
                                                fontWeight: "500",
                                                cursor: "pointer",
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onOpenAddOpinionForContent();
                                            }}
                                        >
                                            <MessageSquarePlus className="w-4 h-4" />
                                            Thêm góp ý
                                        </button>
                                    </>
                                )
                            ) : (
                                <p className="text-sm text-gray-500 italic">Vui lòng chọn nội dung họp ở cột bên trái để thực hiện thao tác.</p>
                            )
                        ) : (
                            <p className="text-sm text-gray-400 italic">Các thao tác chỉ khả dụng khi phiên họp đang diễn ra.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
