import React from 'react';
import { Card } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { Eye, Pause, RotateCcw } from 'lucide-react';
import { CollapsibleSection } from '@/modules/meeting/components/CollapsibleSection';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { TableEngineConfig } from '@/common/components/table-engine/table.types';
import { cn } from '@/common/utils/cn';
import { VotingIssue } from '../../meeting.mock';

interface VotingSectionProps {
    votingIssues: VotingIssue[];
    onToggleBroadcast: (id: number) => void;
    onPauseVoting: (id: number) => void;
    onRevote: (id: number) => void;
    onViewResult: (id: number) => void;
}

export function VotingSection({ votingIssues, onToggleBroadcast, onPauseVoting, onRevote, onViewResult }: VotingSectionProps) {
    const statusMap: Record<string, { label: string; className: string }> = {
        pending: { label: 'Chưa biểu quyết', className: 'bg-amber-100 text-amber-700' },
        broadcasting: { label: 'Đã phát lệnh', className: 'bg-purple-100 text-purple-700' },
        voting: { label: 'Đang biểu quyết', className: 'bg-blue-100 text-blue-700' },
        paused: { label: 'Tạm dừng', className: 'bg-orange-100 text-orange-700' },
        completed: { label: 'Đã hoàn thành', className: 'bg-green-100 text-green-700' }
    };

    const config: TableEngineConfig<VotingIssue> = {
        columns: [
            { key: 'issue', header: 'Vấn đề', render: (row) => <div className="truncate max-w-md" title={row.issue}>{row.issue}</div> },
            { key: 'time', header: 'Thời gian', width: '128px', align: 'center', className: 'font-mono' },
            { key: 'status', header: 'Trạng thái', width: '160px', align: 'center', render: (row) => { const cfg = statusMap[row.status] || statusMap.pending; return <Badge className={cn("px-3 py-1 text-xs rounded-full border-none hover:bg-opacity-80", cfg.className)}>{cfg.label}</Badge>; } },
            { key: 'broadcastEnabled', header: 'Phát lệnh', width: '128px', align: 'center', render: (row) => (
                <button type="button" onClick={() => onToggleBroadcast(row.id)} className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2", row.broadcastEnabled ? "bg-[#C8102E] focus:ring-[#C8102E]" : "bg-gray-300 focus:ring-gray-400")}>
                    <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", row.broadcastEnabled ? "translate-x-6" : "translate-x-1")} />
                </button>
            )},
            { key: 'id', header: 'Hành động', width: '140px', align: 'center', render: (row) => (
                <div className="flex items-center justify-center gap-2">
                    {(row.status === "voting" || row.status === "paused") && (<>
                        <button type="button" onClick={() => onPauseVoting(row.id)} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all" title="Tạm dừng"><Pause className="h-4 w-4" /></button>
                        <button type="button" onClick={() => onRevote(row.id)} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all" title="Bỏ phiếu lại"><RotateCcw className="h-4 w-4" /></button>
                    </>)}
                    <button type="button" onClick={() => onViewResult(row.id)} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all" title="Xem kết quả"><Eye className="h-4 w-4" /></button>
                </div>
            )}
        ]
    };

    return (
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CollapsibleSection title={`Danh sách vấn đề cần biểu quyết (${votingIssues.length})`}>
                <div className="p-0">
                    <DataTable data={votingIssues} config={config} pageSize={10} totalItems={votingIssues.length} onPageChange={() => {}} />
                </div>
            </CollapsibleSection>
        </Card>
    );
}
