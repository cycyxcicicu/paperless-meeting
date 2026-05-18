import React from 'react';
import { Card, CardContent } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { FileText, Download, CheckCircle, PlayCircle, MessageSquarePlus } from 'lucide-react';
import { MeetingContent } from '../../meeting.mock';

interface MeetingDetailPanelProps {
    meetingContents: MeetingContent[];
    activeContent: number;
    onOpenApprove: () => void;
    onOpenStart: () => void;
    onOpenAddOpinionForContent: () => void;
    setSelectedContent: (content: MeetingContent | null) => void;
    setIsStartContentModalOpen: (open: boolean) => void;
}

/**
 * Panel hiển thị chi tiết nội dung đang chọn, thông tin phiên họp,
 * tài liệu đính kèm, và các nút hành động.
 */
export function MeetingDetailPanel({
    meetingContents,
    activeContent,
    onOpenApprove,
    onOpenStart,
    onOpenAddOpinionForContent,
    setSelectedContent,
    setIsStartContentModalOpen,
}: MeetingDetailPanelProps) {
    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CardContent className="p-5 space-y-6">
                {/* Nội dung đang được chọn */}
                <div>
                    <h3 className="text-base btn-primary text-gray-900 mb-4">
                        {meetingContents.find((c) => c.id === activeContent)?.title}
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                            {meetingContents.find((c) => c.id === activeContent)?.description}
                        </p>
                    </div>
                </div>

                {/* Thông tin chi tiết */}
                <div>
                    <h3 className="text-base btn-primary text-gray-900 mb-4">
                        Thông tin chi tiết phiên họp
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-start justify-between">
                            <span className="text-gray-500 body">Chủ trì:</span>
                            <span className="text-gray-900 body">Ông Trần Văn A - Bí thư</span>
                        </div>
                        <div className="flex items-start justify-between">
                            <span className="text-gray-500 body">Người duyệt tài liệu:</span>
                            <span className="text-gray-900 body">Trần Văn C</span>
                        </div>
                        <div className="flex items-start justify-between">
                            <span className="text-gray-500 body">Trạng thái:</span>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">
                                Đang họp
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Tài liệu đính kèm */}
                <div>
                    <h3 className="text-base btn-primary text-gray-900 mb-4">
                        Tài liệu đính kèm
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#C8102E]">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="body text-gray-900 text-sm">
                                        Báo cáo tình hình kinh tế - xã hội Quý 1.pdf
                                    </p>
                                    <p className="text-xs text-gray-500">2.4 MB</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#C8102E]">
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="body text-gray-900 text-sm">
                                        Kế hoạch triển khai Quý 2 chi tiết.docx
                                    </p>
                                    <p className="text-xs text-gray-500">1.1 MB</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#C8102E]">
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons for Content */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            border: "1px solid #16a34a",
                            borderRadius: "9999px",
                            background: "transparent",
                            color: "#16a34a",
                            fontWeight: "500",
                            cursor: "pointer",
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            alert("Phê duyệt clicked!");
                            onOpenApprove();
                        }}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Phê duyệt
                    </button>
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
                            alert("Bắt đầu clicked!");
                            const content = meetingContents.find((c) => c.id === activeContent);
                            setSelectedContent(content || null);
                            setIsStartContentModalOpen(true);
                        }}
                    >
                        <PlayCircle className="w-4 h-4" />
                        Bắt đầu
                    </button>
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
                            alert("Thêm góp ý clicked!");
                            onOpenAddOpinionForContent();
                        }}
                    >
                        <MessageSquarePlus className="w-4 h-4" />
                        Thêm góp ý
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
