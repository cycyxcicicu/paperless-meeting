import React from 'react';
import { Button } from '@/common/components/ui/button';
import {
    Upload, Download, Trash2, Send, CheckCircle, XCircle, Clock
} from 'lucide-react';

interface MeetingFooterActionsProps {
    meetingDetail: any;
    handleDeleteMeeting: () => void;
    handleSubmitApproval: () => void;
    handleApproveMeeting: () => void;
    setIsRejectOpen: (open: boolean) => void;
    setIsCancelConfirmOpen: (open: boolean) => void;
    handlePublishMeeting: () => void;
    setIsConfirmOpen: (open: boolean) => void;
}

export const MeetingFooterActions: React.FC<MeetingFooterActionsProps> = ({
    meetingDetail,
    handleDeleteMeeting,
    handleSubmitApproval,
    handleApproveMeeting,
    setIsRejectOpen,
    setIsCancelConfirmOpen,
    handlePublishMeeting,
    setIsConfirmOpen,
}) => {
    return (
        <div className="p-6 bg-gray-50/50 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100">
            {meetingDetail?.status === "CLOSED" && (
                <>
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
                </>
            )}

            {meetingDetail?.canDelete && (
                <Button
                    variant="outline"
                    className="border-red-600 text-red-655 hover:bg-red-50 body rounded-full px-6 h-[42px]"
                    onClick={handleDeleteMeeting}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa phiên họp
                </Button>
            )}

            {meetingDetail?.canSubmitApproval && (
                <Button
                    variant="primary"
                    className="bg-[#C8102E] hover:bg-[#a80d26] body rounded-full px-6 h-[42px] text-white"
                    onClick={handleSubmitApproval}
                >
                    <Send className="w-4 h-4 mr-2" />
                    Trình duyệt phiên họp
                </Button>
            )}

            {meetingDetail?.canApprove && (
                <>
                    <Button
                        variant="primary"
                        className="bg-[#C8102E] hover:bg-[#a80d26] body rounded-full px-6 h-[42px] text-white"
                        onClick={handleApproveMeeting}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Phê duyệt
                    </Button>
                    <Button
                        variant="outline"
                        className="border-red-600 text-red-655 hover:bg-red-55 body rounded-full px-6 h-[42px]"
                        onClick={() => setIsRejectOpen(true)}
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Từ chối duyệt
                    </Button>
                </>
            )}



            {meetingDetail?.canCancel && (
                <Button
                    variant="outline"
                    className="border-red-600 text-red-655 hover:bg-red-55 body rounded-full px-6 h-[42px]"
                    onClick={() => setIsCancelConfirmOpen(true)}
                >
                    <XCircle className="w-4 h-4 mr-2" />
                    Hủy phiên họp
                </Button>
            )}

            {meetingDetail?.canPublish && (
                <Button
                    variant="primary"
                    className="bg-[#C8102E] hover:bg-[#a80d26] body rounded-full px-6 h-[42px] text-white"
                    onClick={handlePublishMeeting}
                >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Công bố phiên họp
                </Button>
            )}

            {meetingDetail?.canClose && (
                <Button
                    variant="primary"
                    className="bg-[#C8102E] hover:bg-[#a80d26] body rounded-full px-6 h-[42px] text-white"
                    onClick={() => setIsConfirmOpen(true)}
                >
                    Kết thúc phiên họp
                </Button>
            )}
        </div>
    );
};
