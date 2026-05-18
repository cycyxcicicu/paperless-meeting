import React from 'react';
import { Card, CardContent } from '@/common/components/ui/card';
import { EmptyState } from '@/common/components/ui/empty-state';

/**
 * Panel hiển thị lịch sử phiên họp.
 * Hiện tại chưa có dữ liệu, hiển thị EmptyState.
 */
export function MeetingHistoryPanel() {
    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1">
            <CardContent className="p-5 h-full flex flex-col">
                <h3 className="text-base btn-primary text-gray-900 mb-4">
                    Lịch sử phiên họp
                </h3>
                <EmptyState />
            </CardContent>
        </Card>
    );
}
