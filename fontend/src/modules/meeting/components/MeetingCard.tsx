import React from 'react';
import { Clock, Users, MapPin, FileText, Eye } from 'lucide-react';
import { Card, CardContent } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { MeetingActionMenu } from './MeetingActionMenu';
import { Meeting } from '../table/meetingTable.schema';

interface MeetingCardProps {
    meeting: Meeting;
    onViewDetail: (id: number) => void;
    onUpdate: (id: number) => void;
    onCopy: (id: number) => void;
    onPostpone: (id: number) => void;
    onCancel: (id: number) => void;
    onSend: (id: number) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
    meeting,
    onViewDetail,
    onUpdate,
    onCopy,
    onPostpone,
    onCancel,
    onSend
}) => {
    return (
        <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
                <div className="flex items-start gap-6">
                    {/* Left: Date icon + Content */}
                    <div className="flex gap-4 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-[#FEF2F2] flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-xs text-[#C8102E] body">
                                {meeting.date.split("/")[0]}
                            </span>
                            <span className="text-lg heading text-[#C8102E]">
                                T{meeting.date.split("/")[1]}
                            </span>
                        </div>

                        <div className="flex-1">
                            {/* Title */}
                            <div className="flex flex-col mb-2">
                                <h3 className="text-base btn-primary text-[#111827] mb-1">
                                    {meeting.title}
                                </h3>
                                <p className="text-sm text-[#6B7280]">
                                    Chủ trì: {meeting.host}
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
                        <div className="w-10 flex justify-center flex-shrink-0">
                            <MeetingActionMenu
                                meetingId={meeting.id}
                                status={meeting.status}
                                onViewDetail={onViewDetail}
                                onUpdate={onUpdate}
                                onCopy={onCopy}
                                onPostpone={onPostpone}
                                onCancel={onCancel}
                                onSend={onSend}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
