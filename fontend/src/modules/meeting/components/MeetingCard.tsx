import React from 'react';
import { Clock, Users, MapPin, FileText, Eye } from 'lucide-react';
import { Card, CardContent } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { MeetingActionMenu } from './MeetingActionMenu';
import { Meeting } from '../table/meetingTable.schema';

interface MeetingCardProps {
    meeting: Meeting;
    onViewDetail: (id: string) => void;
    onUpdate: (id: string) => void;
    onCopy: (id: string) => void;
    onCancel: (id: string) => void;
    onSend: (id: string) => void;
    onUploadDocs: (id: string) => void;
    onToggleSave?: (id: string) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
    meeting,
    onViewDetail,
    onUpdate,
    onCopy,
    onCancel,
    onSend,
    onUploadDocs,
    onToggleSave
}) => {
    const [isTruncated, setIsTruncated] = React.useState(false);
    const titleRef = React.useRef<HTMLHeadingElement>(null);

    const handleMouseEnter = () => {
        if (titleRef.current) {
            setIsTruncated(titleRef.current.scrollWidth > titleRef.current.clientWidth);
        }
    };

    // Tách ngày tháng an toàn
    const day = meeting.date.includes('/') ? meeting.date.split('/')[0] : '01';
    const month = meeting.date.includes('/') ? meeting.date.split('/')[1] : '01';

    return (
        <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
                <div className="flex items-start gap-6">
                    {/* Left: Date icon + Content */}
                    <div className="flex gap-4 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-[#FEF2F2] flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-xs text-[#C8102E] body">
                                {day}
                            </span>
                            <span className="text-lg heading text-[#C8102E]">
                                T{month}
                            </span>
                        </div>

                        <div className="flex-1">
                            {/* Title */}
                            <div className="flex flex-col mb-2 relative group">
                                <h3 
                                    ref={titleRef}
                                    onMouseEnter={handleMouseEnter}
                                    className={`text-base btn-primary text-[#111827] mb-1 truncate max-w-[360px] md:max-w-[480px] lg:max-w-[600px] ${isTruncated ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    {meeting.title}
                                </h3>
                                {isTruncated && (
                                    <div className="absolute bottom-full mb-1.5 left-0 hidden group-hover:block z-50 animate-in fade-in-0 duration-200">
                                        <div className="bg-white text-gray-800 text-xs rounded-xl px-3.5 py-2.5 whitespace-normal max-w-sm shadow-xl border border-gray-200 break-words leading-relaxed">
                                            {meeting.title}
                                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]"></div>
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-[#6B7280]">
                                    Chủ trì: {meeting.host || 'Chưa xác định'}
                                </p>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
                                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                    <Clock className="h-4 w-4 text-[#9CA3AF]" />
                                    <span>{meeting.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                    <Users className="h-4 w-4 text-[#9CA3AF]" />
                                    <span>{meeting.participants} thành viên</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                    <MapPin className="h-4 w-4 text-[#9CA3AF]" />
                                    <span>{meeting.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                    <FileText className="h-4 w-4 text-[#9CA3AF]" />
                                    <span>{meeting.documents} tài liệu</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center pt-1">
                        {/* Status Badge Column */}
                        <div className="w-[140px] flex justify-start flex-shrink-0">
                            <Badge
                                variant={meeting.statusVariant}
                                className="h-[30px] px-3.5 text-[13px] rounded-full whitespace-nowrap body"
                            >
                                {meeting.status}
                            </Badge>
                        </div>

                        {/* View Detail Icon */}
                        <div className="w-10 flex justify-center flex-shrink-0">
                            <div className="relative group">
                                <button
                                    type="button"
                                    onClick={() => onViewDetail(meeting.id)}
                                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-[#C8102E] transition-all"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap">
                                        Xem chi tiết
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Menu (3 dots) */}
                        {(() => {
                            const hasActions = 
                                meeting.canEdit || 
                                meeting.canCancel || 
                                meeting.canDelete || 
                                meeting.canSubmitApproval || 
                                meeting.canUploadDocs || 
                                meeting.canCopy ||
                                meeting.canApprove ||
                                meeting.rawStatus === 'IN_PROGRESS';
                            
                            if (!hasActions) return <div className="w-10 flex-shrink-0" />;

                            return (
                                <div className="w-10 flex justify-center flex-shrink-0">
                                    <MeetingActionMenu
                                        meetingId={meeting.id}
                                        canEdit={meeting.canEdit}
                                        canCancel={meeting.canCancel}
                                        canPublish={meeting.canPublish}
                                        canDelete={meeting.canDelete}
                                        canSubmitApproval={meeting.canSubmitApproval}
                                        canUploadDocs={meeting.canUploadDocs}
                                        canCopy={meeting.canCopy}
                                        canApprove={meeting.canApprove}
                                        status={meeting.rawStatus}
                                        isSaved={meeting.isSaved}
                                        onToggleSave={onToggleSave}
                                        onViewDetail={onViewDetail}
                                        onUpdate={onUpdate}
                                        onCopy={onCopy}
                                        onCancel={onCancel}
                                        onSend={onSend}
                                        onUploadDocs={onUploadDocs}
                                    />
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
