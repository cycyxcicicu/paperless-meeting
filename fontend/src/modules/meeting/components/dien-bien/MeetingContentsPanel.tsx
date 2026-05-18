import React from 'react';
import { Card, CardContent } from '@/common/components/ui/card';
import { MeetingContent } from '../../meeting.mock';

interface MeetingContentsPanelProps {
    meetingContents: MeetingContent[];
    activeContent: number;
    onSelectContent: (id: number) => void;
}

/**
 * Panel hiển thị danh sách nội dung họp (cột trái).
 * Cho phép người dùng chọn nội dung để xem chi tiết.
 */
export function MeetingContentsPanel({ meetingContents, activeContent, onSelectContent }: MeetingContentsPanelProps) {
    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CardContent className="p-5">
                <h3 className="text-base btn-primary text-gray-900 mb-4">
                    Nội dung họp
                </h3>
                <div className="space-y-2">
                    {meetingContents.map((content) => (
                        <div
                            key={content.id}
                            onClick={() => onSelectContent(content.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                activeContent === content.id
                                    ? "bg-red-50 border border-[#C8102E] text-[#C8102E]"
                                    : "bg-gray-50 border border-transparent text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            <p className="text-sm body">{content.title}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
