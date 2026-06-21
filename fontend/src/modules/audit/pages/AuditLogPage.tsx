import {
  Search,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { AuditSummary } from '@/modules/audit/components/AuditSummary';
import { PageHeader } from '@/common/components/layout/PageHeader';

// Import Table Engine
import { DataTable } from '@/common/components/table-engine/DataTable';
import { getAuditTableColumns, AuditLog } from '../table/auditTable.schema';
import { auditApi, AuditLogStatsResponse } from '../services/audit.api';

const AuditLogPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<AuditLogStatsResponse | null>(null);

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    // Fetch stats
    const fetchStats = async () => {
        try {
            const res = await auditApi.getAuditStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (error: any) {
            console.error("Lỗi khi tải thông số thống kê:", error);
        }
    };

    // Fetch logs
    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await auditApi.getAuditLogs({
                page: currentPage - 1,
                size: pageSize,
                keyword: debouncedSearch,
                sort: "createdAt,desc" // Mặc định sắp xếp log mới nhất lên đầu
            });
            if (res.success && res.data) {
                setLogs(res.data.content);
                setTotalItems(res.data.totalElements);
                setTotalPages(res.data.totalPages);
            }
        } catch (error: any) {
            console.error("Lỗi khi tải danh sách nhật ký:", error);
            const msg = error?.response?.data?.message || "Không thể tải danh sách nhật ký hệ thống";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load and reload when parameters change
    useEffect(() => {
        fetchLogs();
    }, [currentPage, pageSize, debouncedSearch]);

    useEffect(() => {
        fetchStats();
    }, []);

    // Handlers
    const handleRefresh = () => {
        setSearchQuery("");
        setDebouncedSearch("");
        setCurrentPage(1);
        fetchLogs();
        fetchStats();
        toast.success("Dữ liệu đã được cập nhật");
    };

    // Table Config
    const tableConfig = {
      columns: getAuditTableColumns(),
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="p-8">
                {/* Page Header */}
                <PageHeader
                    breadcrumbs={[
                        { name: "Trang chủ", path: "/" },
                        { name: "Quản trị hệ thống", path: "/nguoi-dung" },
                        { name: "Lịch sử truy cập" },
                    ]}
                />

                {/* Summary Strip */}
                <AuditSummary
                    totalLogs={stats?.totalLogs ?? 0}
                    todayLogs={stats?.todayLogs ?? 0}
                    criticalActions={stats?.criticalActions ?? 0}
                    activeUsers={stats?.activeUsers ?? 0}
                />

                {/* Main Content Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/50 overflow-hidden"
                >
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-20">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex-1 relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C8102E] transition-colors" />
                          <input
                            type="text"
                            placeholder="Tìm kiếm theo người dùng, mô tả..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C8102E]/50 focus:ring-4 focus:ring-[#C8102E]/5 focus:bg-white transition-all"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={handleRefresh}
                            className="w-11 h-11 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                            title="Làm mới"
                            disabled={isLoading}
                          >
                            <RefreshCw className={`h-4.5 w-4.5 ${isLoading ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Table Content */}
                    <div className="p-0">
                      <DataTable
                        data={logs}
                        config={tableConfig}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                        itemLabel="nhật ký"
                        getRowId={(row) => row.id}
                        isLoading={isLoading}
                      />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuditLogPage;
