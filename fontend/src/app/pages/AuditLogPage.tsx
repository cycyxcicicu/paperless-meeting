import { clsx, type ClassValue } from "clsx";
import {
    Activity,
    ChevronLeft,
    ChevronRight,
    History,
    Home,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { AuditFilters } from "../components/audit/AuditFilters";
import { AuditSummary } from "../components/audit/AuditSummary";
import { AuditLog, AuditTable } from "../components/audit/AuditTable";
import { AuditToolbar } from "../components/audit/AuditToolbar";
import { Pagination } from "@/app/components/common/ui/Pagination";
import { PageHeader } from "../components/layout/PageHeader";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const mockAuditLogs: AuditLog[] = [
    {
        id: "1",
        username: "Nguyễn Văn An",
        userRole: "Quản trị viên",
        ipAddress: "192.168.1.105",
        action: "create",
        objectType: "Cuộc họp",
        objectName: "Họp ban Thường vụ Thành ủy tháng 4/2026",
        description: "Tạo cuộc họp mới với 15 thành viên tham dự",
        timestamp: "2026-04-17T14:30:25",
        severity: "low",
    },
    {
        id: "2",
        username: "Trần Thị Bình",
        userRole: "Chuyên viên",
        ipAddress: "192.168.1.112",
        action: "update",
        objectType: "Tài liệu",
        objectName: "Báo cáo tình hình kinh tế Q1/2026",
        description: "Cập nhật nội dung tài liệu, thêm biểu đồ phân tích",
        timestamp: "2026-04-17T13:15:10",
        severity: "low",
    },
    {
        id: "3",
        username: "Phạm Minh Châu",
        userRole: "Quản trị viên",
        ipAddress: "192.168.1.98",
        action: "delete",
        objectType: "Người dùng",
        objectName: "Lê Văn Dũng",
        description: "Xóa tài khoản người dùng đã nghỉ việc",
        timestamp: "2026-04-17T11:45:33",
        severity: "high",
    },
    {
        id: "4",
        username: "Hoàng Thị Diệu",
        userRole: "Trưởng phòng",
        ipAddress: "192.168.1.87",
        action: "read",
        objectType: "Tài liệu",
        objectName: "Biên bản họp ngày 15/04/2026",
        description: "Xem và tải xuống tài liệu biên bản",
        timestamp: "2026-04-17T10:20:15",
        severity: "low",
    },
    {
        id: "5",
        username: "Đặng Văn Em",
        userRole: "Quản trị viên",
        ipAddress: "192.168.1.105",
        action: "update",
        objectType: "Vai trò",
        objectName: "Vai trò Chuyên viên cấp cao",
        description: "Cập nhật quyền truy cập module báo cáo",
        timestamp: "2026-04-17T09:55:42",
        severity: "critical",
    },
    {
        id: "6",
        username: "Vũ Thị Phương",
        userRole: "Chuyên viên",
        ipAddress: "192.168.1.134",
        action: "create",
        objectType: "Phòng họp",
        objectName: "Phòng họp Trung tâm 3",
        description: "Đăng ký phòng họp mới với sức chứa 25 người",
        timestamp: "2026-04-17T09:10:28",
        severity: "low",
    },
    {
        id: "7",
        username: "Lý Minh Giang",
        userRole: "Phó Chánh Văn phòng",
        ipAddress: "192.168.1.76",
        action: "update",
        objectType: "Cuộc họp",
        objectName: "Họp giao ban tuần 15",
        description: "Thay đổi thời gian họp từ 14h sang 15h30",
        timestamp: "2026-04-16T16:40:19",
        severity: "medium",
    },
    {
        id: "8",
        username: "Phan Văn Hải",
        userRole: "Quản trị viên",
        ipAddress: "192.168.1.105",
        action: "delete",
        objectType: "Tài liệu",
        objectName: "Tài liệu draft - Kế hoạch cũ",
        description: "Xóa tài liệu nháp không còn sử dụng",
        timestamp: "2026-04-16T15:22:51",
        severity: "low",
    },
    {
        id: "9",
        username: "Ngô Thị Lan",
        userRole: "Trưởng phòng",
        ipAddress: "192.168.1.92",
        action: "create",
        objectType: "Người dùng",
        objectName: "Trương Văn Khoa",
        description: "Tạo tài khoản mới cho nhân viên mới",
        timestamp: "2026-04-16T14:05:37",
        severity: "medium",
    },
    {
        id: "10",
        username: "Bùi Minh Long",
        userRole: "Chuyên viên",
        ipAddress: "192.168.1.145",
        action: "read",
        objectType: "Cuộc họp",
        objectName: "Họp Ban Chấp hành tháng 3",
        description: "Xem lịch sử và biên bản cuộc họp",
        timestamp: "2026-04-16T13:18:44",
        severity: "low",
    },
    {
        id: "11",
        username: "Đinh Thị Mai",
        userRole: "Quản trị viên",
        ipAddress: "192.168.1.98",
        action: "update",
        objectType: "Cấu hình",
        objectName: "Cấu hình bảo mật hệ thống",
        description: "Bật xác thực hai yếu tố cho tất cả quản trị viên",
        timestamp: "2026-04-16T11:50:12",
        severity: "critical",
    },
    {
        id: "12",
        username: "Võ Văn Nam",
        userRole: "Chuyên viên",
        ipAddress: "192.168.1.156",
        action: "create",
        objectType: "Tài liệu",
        objectName: "Nghị quyết số 05/2026/NQ-HĐND",
        description: "Upload tài liệu nghị quyết mới",
        timestamp: "2026-04-16T10:35:29",
        severity: "low",
    },
];

const AuditLogPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAction, setSelectedAction] = useState("all");
    const [selectedObjectType, setSelectedObjectType] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter logs
    const filteredLogs = useMemo(() => {
        return mockAuditLogs.filter((log) => {
            const matchesSearch =
                searchQuery === "" ||
                log.username
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                log.ipAddress.includes(searchQuery) ||
                log.objectName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                log.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());

            const matchesAction =
                selectedAction === "all" || log.action === selectedAction;
            const matchesObjectType =
                selectedObjectType === "all" ||
                log.objectType.toLowerCase() === selectedObjectType;

            return matchesSearch && matchesAction && matchesObjectType;
        });
    }, [searchQuery, selectedAction, selectedObjectType]);

    const totalPages = Math.ceil(filteredLogs.length / pageSize);
    const currentData = filteredLogs.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    // Calculate stats
    const todayLogs = mockAuditLogs.filter(
        (log) =>
            new Date(log.timestamp).toDateString() ===
            new Date().toDateString(),
    ).length;

    const criticalActions = mockAuditLogs.filter(
        (log) => log.severity === "critical" || log.severity === "high",
    ).length;

    const activeUsers = new Set(mockAuditLogs.map((log) => log.username)).size;

    const activeFiltersCount =
        (selectedAction !== "all" ? 1 : 0) +
        (selectedObjectType !== "all" ? 1 : 0);

    // Handlers
    const handleRefresh = () => {
        toast.success("Dữ liệu đã được cập nhật");
    };

    const handleExport = () => {
        toast.info("Đang chuẩn bị file xuất dữ liệu...");
    };

    const handleSettings = () => {
        toast.info("Cấu hình audit log");
    };

    const handleClearFilters = () => {
        setSelectedAction("all");
        setSelectedObjectType("all");
        setSearchQuery("");
    };

    return (
        <>
            <div className="p-8">
                {/* Page Header */}
                <PageHeader
                    breadcrumbs={[
                        { name: "Trang chủ", path: "/" },
                        { name: "Quản trị hệ thống", path: "/nguoi-dung" },
                        { name: "Lịch sử thay đổi" },
                    ]}
                    actions={
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl">
                            <Activity className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                                Monitoring Active
                            </span>
                        </div>
                    }
                />

                {/* Summary Strip */}
                <AuditSummary
                    totalLogs={mockAuditLogs.length}
                    todayLogs={todayLogs}
                    criticalActions={criticalActions}
                    activeUsers={activeUsers}
                />

                {/* Main Content Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-200/50 overflow-hidden"
                >
                    {/* Toolbar */}
                    <AuditToolbar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        activeFiltersCount={activeFiltersCount}
                        onRefresh={handleRefresh}
                        onExport={handleExport}
                        onSettings={handleSettings}
                    />

                    {/* Filters */}
                    <AuditFilters
                        show={showFilters}
                        selectedAction={selectedAction}
                        setSelectedAction={setSelectedAction}
                        selectedObjectType={selectedObjectType}
                        setSelectedObjectType={setSelectedObjectType}
                        onClearFilters={handleClearFilters}
                    />

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        {filteredLogs.length > 0 ? (
                            <motion.div
                                key="table"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <AuditTable
                                    logs={currentData}
                                    currentPage={currentPage}
                                    pageSize={pageSize}
                                />

                                {/* Pagination */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    totalItems={filteredLogs.length}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={setPageSize}
                                    itemLabel="log"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="py-16 text-center"
                            >
                                <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-sm text-gray-500 font-medium">
                                    Không tìm thấy log nào phù hợp với bộ lọc
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </>
    );
};

export default AuditLogPage;
