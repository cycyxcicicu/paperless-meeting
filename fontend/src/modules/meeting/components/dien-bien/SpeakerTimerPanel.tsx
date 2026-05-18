import React from 'react';
import { Card, CardContent } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { EmptyState } from '@/common/components/ui/empty-state';
import { User } from 'lucide-react';
import { Speaker } from '../../meeting.mock';

interface SpeakerTimerPanelProps {
    currentSpeaker: Speaker | undefined;
    onEndSpeaking: () => void;
}

/**
 * Panel hiển thị người đang phát biểu và thời gian còn lại (cột phải).
 */
export function SpeakerTimerPanel({ currentSpeaker, onEndSpeaking }: SpeakerTimerPanelProps) {
    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base btn-primary text-gray-900">
                        Thời gian phát biểu còn lại
                    </h3>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1.5 text-sm rounded-full border-none font-mono heading">
                        00:09:44
                    </Badge>
                </div>

                {currentSpeaker ? (
                    <>
                        {/* Avatar placeholder */}
                        <div className="flex justify-center mb-4">
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-12 h-12 text-gray-400" />
                            </div>
                        </div>

                        {/* Thông tin người phát biểu */}
                        <div className="space-y-2 text-sm text-center mb-4">
                            <p className="text-gray-900 btn-primary">{currentSpeaker.name}</p>
                            <p className="text-gray-600">{currentSpeaker.position}</p>
                            <p className="text-gray-500">{currentSpeaker.unit}</p>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-[#C8102E] text-[#C8102E] hover:bg-red-50 body rounded-full"
                            onClick={onEndSpeaking}
                        >
                            Kết thúc phát biểu
                        </Button>
                    </>
                ) : (
                    <EmptyState title="Không có dữ liệu" />
                )}
            </CardContent>
        </Card>
    );
}
