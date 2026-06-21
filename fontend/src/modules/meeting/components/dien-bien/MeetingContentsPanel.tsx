import React from 'react';
import { Card, CardContent } from '@/common/components/ui/card';
import { MeetingContent } from '../../meeting.mock';

interface MeetingContentsPanelProps {
    meetingContents: MeetingContent[];
    activeContent: string | number;
    onSelectContent: (id: string | number) => void;
}

/**
 * Panel hiển thị danh sách nội dung họp (cột trái).
 * Cho phép người dùng chọn nội dung để xem chi tiết.
 */
export function MeetingContentsPanel({ meetingContents, activeContent, onSelectContent }: MeetingContentsPanelProps) {
    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
            <CardContent className="p-5 flex-1 overflow-y-auto">
                <h3 className="text-base btn-primary text-gray-900 mb-4">
                    Nội dung họp
                </h3>
                <div className="space-y-2">
                    {meetingContents.map((content) => (
                        <div
                            key={content.id}
                            onClick={() => onSelectContent(content.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                                activeContent === content.id
                                    ? "bg-red-50 border border-[#C8102E] text-[#C8102E]"
                                    : "bg-gray-50 border border-transparent text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            <p className="text-sm body flex-1 truncate">{content.title}</p>
                            {content.status === "IN_PROGRESS" && (
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
