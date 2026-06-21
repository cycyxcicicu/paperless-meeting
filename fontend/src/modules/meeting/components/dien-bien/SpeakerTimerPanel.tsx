import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { EmptyState } from '@/common/components/ui/empty-state';
import { User } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Speaker } from '../../meeting.mock';
import { formatSecondsToHMS } from '@/common/utils/timeHelpers';

interface SpeakerTimerPanelProps {
    currentSpeaker: Speaker | undefined;
    onEndSpeaking: () => void;
    isGuest?: boolean;
}

/**
 * Panel hiển thị người đang phát biểu và thời gian còn lại (cột phải).
 */
export function SpeakerTimerPanel({ currentSpeaker, onEndSpeaking, isGuest }: SpeakerTimerPanelProps) {
    const [timeLeft, setTimeLeft] = useState<number>(300); // 5 phút mặc định (300 giây)

    useEffect(() => {
        if (!currentSpeaker) return;

        // Tính toán thời gian bắt đầu thực tế nếu có
        let initialSeconds = 300;
        if (currentSpeaker.startTime) {
            try {
                const start = new Date(currentSpeaker.startTime).getTime();
                const now = Date.now();
                const diffSeconds = Math.floor((now - start) / 1000);
                initialSeconds = Math.max(0, 300 - diffSeconds);
            } catch (e) {
                initialSeconds = 300;
            }
        }

        setTimeLeft(initialSeconds);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentSpeaker]);

    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base btn-primary text-gray-900">
                        Thời gian phát biểu còn lại
                    </h3>
                    {currentSpeaker && (
                        <Badge className={cn(
                            "px-3 py-1.5 text-sm rounded-full border-none font-mono heading hover:opacity-90",
                            timeLeft > 60 ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"
                        )}>
                            {formatSecondsToHMS(timeLeft)}
                        </Badge>
                    )}
                </div>

                {currentSpeaker ? (
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            {/* Avatar placeholder */}
                            <div className="flex justify-center mb-4">
                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="w-12 h-12 text-gray-400" />
                                </div>
                            </div>

                            {/* Thông tin người phát biểu */}
                            <div className="space-y-2 text-sm text-center mb-4">
                                <p className="text-gray-900 font-semibold">{currentSpeaker.name}</p>
                                <p className="text-gray-650">{currentSpeaker.position}</p>
                                <p className="text-gray-500">{currentSpeaker.unit}</p>
                            </div>
                        </div>

                        {!isGuest && (
                            <Button
                                variant="outline"
                                className="w-full border-[#C8102E] text-[#C8102E] hover:bg-red-50 body rounded-full"
                                onClick={onEndSpeaking}
                            >
                                Kết thúc phát biểu
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <EmptyState title="Không có dữ liệu" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
