import {
  Search,
  RefreshCw,
  History,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { AuditSummary } from '@/modules/audit/components/AuditSummary';
import { PageHeader } from '@/common/components/layout/PageHeader';

// Import Table Engine
import { DataTable } from '@/common/components/table-engine/DataTable';
import { getAuditTableColumns, AuditLog } from '../table/auditTable.schema';

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
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter logs
    const filteredLogs = useMemo(() => {
        return mockAuditLogs.filter((log) => {
            return searchQuery === "" ||
                log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.objectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.description.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [searchQuery]);

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

    // Handlers
    const handleRefresh = () => {
        toast.success("Dữ liệu đã được cập nhật");
        setSearchQuery("");
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
                    totalLogs={mockAuditLogs.length}
                    todayLogs={todayLogs}
                    criticalActions={criticalActions}
                    activeUsers={activeUsers}
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
                            placeholder="Tìm kiếm theo người dùng, đối tượng, mô tả..."
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
                          >
                            <RefreshCw className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Table Content */}
                    <div className="p-0">
                      <DataTable
                        data={currentData}
                        config={tableConfig}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalItems={filteredLogs.length}
                        totalPages={Math.ceil(filteredLogs.length / pageSize)}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                        itemLabel="log"
                        getRowId={(row) => row.id}
                      />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuditLogPage;
