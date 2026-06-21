import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    message?: string;
}

export function LoadingOverlay({ message = "Đang tải dữ liệu phiên họp..." }: LoadingOverlayProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/10 backdrop-blur-[3px] transition-all duration-300">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-[#C8102E] animate-spin" />
                <p className="text-sm font-medium text-gray-700">{message}</p>
            </div>
        </div>
    );
}
