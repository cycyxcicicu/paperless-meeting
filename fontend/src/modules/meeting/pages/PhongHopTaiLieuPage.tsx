import { clsx, type ClassValue } from "clsx";
import {
    Download,
    Edit,
    Eye,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { getFileIconStyle } from "@/common/utils/fileHelpers";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router";
import { twMerge } from "tailwind-merge";
import { PageHeader } from '@/common/components/layout/PageHeader';
import { Sidebar } from '@/common/components/layout/Sidebar';
import { Pagination } from '@/common/components/ui/app-pagination';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { PHIEN_HOP_SIDEBAR_ITEMS, PHONG_HOP_SIDEBAR_ITEMS } from '@/app/constants/sidebar';

interface Document {
    id: string;
    code: string;
    name: string;
    type: "pdf" | "doc" | "xls";
    author: string;
    uploadDate: string;
    size: string;
    status: "published" | "draft";
}

const mockDataMap: Record<string, Document[]> = {
    "nghi-quyet": [
        {
            id: "1",
            code: "NQ-01/2026",
            name: "Nghị quyết về phát triển kinh tế xã hội quý I",
            type: "pdf",
            author: "Nguyễn Văn A",
            uploadDate: "2026-04-10",
            size: "2.4 MB",
            status: "published",
        },
        {
            id: "2",
            code: "NQ-02/2026",
            name: "Nghị quyết phê duyệt ngân sách năm 2026",
            type: "doc",
            author: "Trần Thị B",
            uploadDate: "2026-04-12",
            size: "1.1 MB",
            status: "published",
        },
        {
            id: "3",
            code: "NQ-03/2026",
            name: "Nghị quyết bổ nhiệm nhân sự cấp cao",
            type: "pdf",
            author: "Lê Văn C",
            uploadDate: "2026-04-15",
            size: "3.5 MB",
            status: "draft",
        },
    ],
    "bao-cao": [
        {
            id: "4",
            code: "BC-11/2026",
            name: "Báo cáo tổng kết công tác tháng 3",
            type: "xls",
            author: "Phạm Thu D",
            uploadDate: "2026-04-05",
            size: "5.2 MB",
            status: "published",
        },
        {
            id: "5",
            code: "BC-12/2026",
            name: "Báo cáo tiến độ dự án chuyển đổi số",
            type: "pdf",
            author: "Hoàng Minh E",
            uploadDate: "2026-04-08",
            size: "4.8 MB",
            status: "published",
        },
        {
            id: "6",
            code: "BC-13/2026",
            name: "Báo cáo tài chính quý I/2026",
            type: "xls",
            author: "Vũ Hải F",
            uploadDate: "2026-04-14",
            size: "8.1 MB",
            status: "draft",
        },
    ],
    "to-trinh": [
        {
            id: "7",
            code: "TT-05/2026",
            name: "Tờ trình xin cấp vốn đầu tư hạ tầng",
            type: "doc",
            author: "Đặng Ngọc G",
            uploadDate: "2026-04-02",
            size: "1.5 MB",
            status: "published",
        },
        {
            id: "8",
            code: "TT-06/2026",
            name: "Tờ trình ban hành quy chế làm việc mới",
            type: "pdf",
            author: "Ngô Thanh H",
            uploadDate: "2026-04-16",
            size: "2.2 MB",
            status: "draft",
        },
    ],
};

const getFileIcon = (type: string) => {
    const style = getFileIconStyle(type);
    const Icon = style.icon;
    return <Icon className={`w-5 h-5 ${style.text}`} />;
};

const PhongHopTaiLieuPage = () => {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    let docTypeKey = "nghi-quyet";
    let title = "Tài liệu";
    let description = "Quản lý và tra cứu tài liệu phục vụ họp";

    if (location.pathname.includes("bao-cao")) {
        docTypeKey = "bao-cao";
        title = "Báo cáo";
        description = "Danh sách các báo cáo trong hệ thống";
    } else if (location.pathname.includes("to-trinh")) {
        docTypeKey = "to-trinh";
        title = "Tờ trình";
        description = "Danh sách các tờ trình đề xuất";
    } else {
        title = "Nghị quyết";
        description = "Danh sách các nghị quyết đã ban hành";
    }

    const currentData = mockDataMap[docTypeKey] || [];

    const filteredData = useMemo(() => {
        return currentData.filter(
            (doc) =>
                doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.author.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [currentData, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const currentDataPage = filteredData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const isPhienHopContext = location.pathname.startsWith("/phien-hop");

    return (
        <>
            <div className="p-8">
                    <PageHeader
                        title={title}
                        description={description}
                        breadcrumbs={[
                            { name: "Trang chủ", path: "/" },
                            { 
                                name: isPhienHopContext ? "Quản lý phiên họp" : "Phòng họp", 
                                path: isPhienHopContext ? "/phien-hop" : "/phong-hop" 
                            },
                            { name: title },
                        ]}
                    />

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, mã, người đăng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm body hover:bg-[#A90F14] transition-all shadow-sm shadow-red-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm mới
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs heading text-gray-500 uppercase tracking-wider w-[60px]">
                                            STT
                                        </th>
                                        <th className="px-6 py-4 text-xs heading text-gray-500 uppercase tracking-wider w-[150px]">
                                            Mã TL
                                        </th>
                                        <th className="px-6 py-4 text-xs heading text-gray-500 uppercase tracking-wider">
                                            Tên tài liệu
                                        </th>
                                        <th className="px-6 py-4 text-xs heading text-gray-500 uppercase tracking-wider w-[180px]">
                                            Người đăng
                                        </th>
                                        <th className="px-6 py-4 text-xs heading text-gray-500 uppercase tracking-wider w-[120px]">
                                            Ngày đăng
                                        </th>
                                        <th className="px-6 py-4 text-xs heading text-gray-500 uppercase tracking-wider text-right w-[320px]">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentDataPage.length > 0 ? (
                                        currentDataPage.map((doc, index) => (
                                            <tr
                                                key={doc.id}
                                                className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-500 body">
                                                    {((currentPage - 1) * pageSize + index + 1)
                                                        .toString()
                                                        .padStart(2, "0")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono body">
                                                        {doc.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                                            {getFileIcon(
                                                                doc.type,
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm heading text-gray-900 group-hover:text-[#C8102E] transition-colors line-clamp-1">
                                                                {doc.name}
                                                            </span>
                                                            <span className="text-xs text-gray-500 mt-0.5">
                                                                Dung lượng:{" "}
                                                                {doc.size}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 body">
                                                    {doc.author}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {doc.uploadDate}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 flex-wrap">
                                                        <button className="px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold">
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>Xem</span>
                                                        </button>
                                                        <button className="px-2 py-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold">
                                                            <Download className="w-3.5 h-3.5" />
                                                            <span>Tải</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedDoc(
                                                                    doc,
                                                                );
                                                                setIsEditModalOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            className="px-2 py-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border border-amber-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold">
                                                            <Edit className="w-3.5 h-3.5" />
                                                            <span>Sửa</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedDoc(
                                                                    doc,
                                                                );
                                                                setIsDeleteModalOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Xóa</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                Không tìm thấy tài liệu nào.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {filteredData.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                pageSize={pageSize}
                                totalItems={filteredData.length}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                                itemLabel="tài liệu"
                            />
                        )}
                    </div>
                </div>
            {/* Modals */}
            <AnimatePresence>
                {(isAddModalOpen || isEditModalOpen) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h3 className="text-lg heading text-gray-900">
                                    {isAddModalOpen
                                        ? "Thêm mới tài liệu"
                                        : "Cập nhật tài liệu"}
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setIsEditModalOpen(false);
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm btn-primary text-gray-700 mb-1.5">
                                        Tên tài liệu{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={
                                            isEditModalOpen
                                                ? selectedDoc?.name
                                                : ""
                                        }
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                        placeholder="Nhập tên tài liệu..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm btn-primary text-gray-700 mb-1.5">
                                            Mã tài liệu{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            defaultValue={
                                                isEditModalOpen
                                                    ? selectedDoc?.code
                                                    : ""
                                            }
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                            placeholder="Nhập mã tài liệu..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm btn-primary text-gray-700 mb-1.5">
                                            Loại tài liệu
                                        </label>
                                        <select
                                            defaultValue={
                                                isEditModalOpen
                                                    ? selectedDoc?.type
                                                    : "pdf"
                                            }
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                        >
                                            <option value="pdf">PDF</option>
                                            <option value="doc">Word</option>
                                            <option value="xls">Excel</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm btn-primary text-gray-700 mb-1.5">
                                        Tập tin đính kèm
                                    </label>
                                    <div className="w-full p-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                                            <Plus className="w-6 h-6 text-[#C8102E]" />
                                        </div>
                                        <span className="text-sm body text-gray-900">
                                            Kéo thả file hoặc click để tải lên
                                        </span>
                                        <span className="text-xs text-gray-500 mt-1">
                                            Hỗ trợ PDF, DOCX, XLSX (Tối đa 50MB)
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                                <button
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setIsEditModalOpen(false);
                                    }}
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm btn-primary hover:bg-gray-50 transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setIsEditModalOpen(false);
                                    }}
                                    className="px-4 py-2 bg-[#C8102E] text-white rounded-xl text-sm btn-primary shadow-sm hover:bg-[#A90F14] transition-colors shadow-red-500/20"
                                >
                                    {isAddModalOpen
                                        ? "Lưu tài liệu"
                                        : "Cập nhật"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-[#C8102E]" />
                            </div>
                            <h3 className="text-lg heading text-gray-900 mb-2">
                                Xóa tài liệu
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Bạn có chắc chắn muốn xóa tài liệu{" "}
                                <span className="btn-primary text-gray-700">
                                    "{selectedDoc?.name}"
                                </span>
                                ? Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm btn-primary hover:bg-gray-200 transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm btn-primary shadow-sm hover:bg-[#A90F14] transition-colors shadow-red-500/20"
                                >
                                    Xóa ngay
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PhongHopTaiLieuPage;
