import { clsx, type ClassValue } from "clsx";
import { ChevronLeft, ChevronRight, Home, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { toast } from "../../lib/toast";
import { DeleteLocationModal } from "../components/meeting-rooms/DeleteLocationModal";
import { LocationEmptyState } from "../components/meeting-rooms/LocationEmptyState";
import { LocationFormModal } from "../components/meeting-rooms/LocationFormModal";
import { LocationSummary } from "../components/meeting-rooms/LocationSummary";
import {
    LocationTable,
    MeetingLocation,
} from "../components/meeting-rooms/LocationTable";
import { LocationToolbar } from "../components/meeting-rooms/LocationToolbar";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const mockLocations: MeetingLocation[] = [
    {
        id: "1",
        name: "Phòng họp Hội đồng",
        code: "HD-01",
        building: "Tòa nhà A",
        floor: "Tầng 5",
        capacity: 50,
        facilities: ["wifi", "projector", "coffee"],
        status: "active",
        lastUsed: "2026-04-15",
    },
    {
        id: "2",
        name: "Phòng họp Điều hành",
        code: "DH-02",
        building: "Tòa nhà A",
        floor: "Tầng 4",
        capacity: 20,
        facilities: ["wifi", "projector"],
        status: "active",
        lastUsed: "2026-04-16",
    },
    {
        id: "3",
        name: "Phòng họp Thường trực",
        code: "TT-03",
        building: "Tòa nhà B",
        floor: "Tầng 3",
        capacity: 15,
        facilities: ["wifi", "coffee"],
        status: "active",
        lastUsed: "2026-04-14",
    },
    {
        id: "4",
        name: "Phòng họp Kế hoạch",
        code: "KH-04",
        building: "Tòa nhà A",
        floor: "Tầng 3",
        capacity: 12,
        facilities: ["wifi", "projector"],
        status: "active",
        lastUsed: "2026-04-10",
    },
    {
        id: "5",
        name: "Phòng họp Văn phòng",
        code: "VP-05",
        building: "Tòa nhà B",
        floor: "Tầng 2",
        capacity: 10,
        facilities: ["wifi"],
        status: "active",
        lastUsed: "2026-04-12",
    },
    {
        id: "6",
        name: "Phòng họp Chuyên viên",
        code: "CV-06",
        building: "Tòa nhà A",
        floor: "Tầng 2",
        capacity: 8,
        facilities: ["wifi", "projector"],
        status: "active",
    },
    {
        id: "7",
        name: "Phòng họp Đa năng",
        code: "DN-07",
        building: "Tòa nhà C",
        floor: "Tầng 1",
        capacity: 30,
        facilities: ["wifi", "projector", "coffee"],
        status: "active",
        lastUsed: "2026-04-17",
    },
    {
        id: "8",
        name: "Phòng họp Nhỏ A",
        code: "NH-08",
        building: "Tòa nhà A",
        floor: "Tầng 1",
        capacity: 6,
        facilities: ["wifi"],
        status: "inactive",
    },
];

const PhongHopPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal state
    const [locationFormModal, setLocationFormModal] = useState<{
        isOpen: boolean;
        mode: "create" | "edit" | "view";
        location?: MeetingLocation;
    }>({ isOpen: false, mode: "create" });

    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        location?: MeetingLocation;
    }>({ isOpen: false });

    // Filter locations
    const filteredLocations = useMemo(() => {
        return mockLocations.filter(
            (loc) =>
                loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                loc.building.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [searchQuery]);

    const totalPages = Math.ceil(filteredLocations.length / pageSize);
    const currentData = filteredLocations.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    // Calculate stats
    const totalCapacity = mockLocations.reduce(
        (acc, loc) => acc + loc.capacity,
        0,
    );
    const activeLocations = mockLocations.filter(
        (loc) => loc.status === "active",
    ).length;
    const recentlyUsed = mockLocations.filter((loc) => loc.lastUsed).length;

    // Handlers
    const handleRefresh = () => {
        toast.success("Làm mới dữ liệu", "Dữ liệu địa điểm đã được cập nhật");
        setSearchQuery("");
    };

    const handleAddNew = () => {
        setLocationFormModal({ isOpen: true, mode: "create" });
    };

    const handleExport = () => {
        toast.info("Xuất dữ liệu", "Đang chuẩn bị dữ liệu xuất file...");
    };

    const handleView = (id: string) => {
        const location = mockLocations.find((l) => l.id === id);
        if (location) {
            setLocationFormModal({ isOpen: true, mode: "view", location });
        }
    };

    const handleEdit = (id: string) => {
        const location = mockLocations.find((l) => l.id === id);
        if (location) {
            setLocationFormModal({ isOpen: true, mode: "edit", location });
        }
    };

    const handleDelete = (id: string) => {
        const location = mockLocations.find((l) => l.id === id);
        if (location) {
            setDeleteModal({ isOpen: true, location });
        }
    };

    const handleResetSearch = () => {
        setSearchQuery("");
    };

    const handleCloseLocationFormModal = () => {
        setLocationFormModal({ isOpen: false, mode: "create" });
    };

    const handleCloseDeleteModal = () => {
        setDeleteModal({ isOpen: false });
    };

    const handleSubmitLocationForm = (locationData: any) => {
        console.log("Location form submitted:", locationData);

        if (locationFormModal.mode === "create") {
            toast.success(
                "Thêm địa điểm thành công",
                `Đã thêm địa điểm "${locationData.name}" vào hệ thống`,
            );
            // TODO: Call API to create location
        } else if (locationFormModal.mode === "edit") {
            toast.success(
                "Cập nhật địa điểm thành công",
                `Thông tin địa điểm "${locationData.name}" đã được cập nhật`,
            );
            // TODO: Call API to update location
        }
    };

    const handleConfirmDelete = () => {
        console.log("Delete location:", deleteModal.location);
        if (deleteModal.location) {
            toast.success(
                "Xóa địa điểm thành công",
                `Đã xóa địa điểm "${deleteModal.location.name}" khỏi hệ thống`,
            );
        }
        // TODO: Call API to delete location
    };

    return (
        <>
            {/* Page Header */}
            <div className="bg-white border-b border-gray-200/60 px-8 py-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    <Home className="h-3.5 w-3.5" />
                    <span>Trang chủ</span>
                    <span>/</span>
                    <span>Phòng họp</span>
                    <span>/</span>
                    <span className="text-[#C8102E]">Địa điểm họp</span>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">
                            Quản lý địa điểm họp
                        </h1>
                        <p className="text-sm text-gray-500">
                            Danh sách phòng họp và cơ sở vật chất phục vụ cuộc
                            họp
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="h-4 w-4 text-[#C8102E]" />
                        <span className="font-medium text-gray-700">
                            Cập nhật: 17/04/2026
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Summary Strip */}
                <LocationSummary
                    totalLocations={mockLocations.length}
                    totalCapacity={totalCapacity}
                    activeLocations={activeLocations}
                    recentlyUsed={recentlyUsed}
                />

                {/* Main Content Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-200/50 overflow-hidden"
                >
                    {/* Toolbar */}
                    <LocationToolbar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onRefresh={handleRefresh}
                        onAddNew={handleAddNew}
                        onExport={handleExport}
                    />

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        {filteredLocations.length > 0 ? (
                            <motion.div
                                key="table"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <LocationTable
                                    locations={currentData}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onView={handleView}
                                    currentPage={currentPage}
                                    pageSize={pageSize}
                                />

                                {/* Pagination */}
                                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                                    <p className="text-sm text-gray-500 font-medium">
                                        Hiển thị{" "}
                                        <span className="text-gray-900 font-semibold">
                                            {(currentPage - 1) * pageSize + 1}
                                        </span>{" "}
                                        -{" "}
                                        <span className="text-gray-900 font-semibold">
                                            {Math.min(
                                                currentPage * pageSize,
                                                filteredLocations.length,
                                            )}
                                        </span>{" "}
                                        trong tổng số{" "}
                                        <span className="text-gray-900 font-bold">
                                            {filteredLocations.length}
                                        </span>{" "}
                                        địa điểm
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="h-4.5 w-4.5" />
                                        </button>

                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() =>
                                                    setCurrentPage(i + 1)
                                                }
                                                className={cn(
                                                    "w-9 h-9 flex items-center justify-center rounded-lg font-bold text-sm transition-all",
                                                    currentPage === i + 1
                                                        ? "bg-[#C8102E] text-white shadow-md"
                                                        : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900",
                                                )}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}

                                        <button
                                            disabled={
                                                currentPage === totalPages
                                            }
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.min(totalPages, p + 1),
                                                )
                                            }
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="h-4.5 w-4.5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">
                                            Hiển thị
                                        </span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) =>
                                                setPageSize(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="h-9 pl-3 pr-8 text-sm font-semibold bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#C8102E] transition-all cursor-pointer"
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <LocationEmptyState
                                    type={searchQuery ? "search" : "no-data"}
                                    onReset={handleResetSearch}
                                    onAdd={handleAddNew}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Modals */}
            <LocationFormModal
                isOpen={locationFormModal.isOpen}
                onClose={handleCloseLocationFormModal}
                onSubmit={handleSubmitLocationForm}
                mode={locationFormModal.mode}
                initialData={
                    locationFormModal.location
                        ? {
                              id: locationFormModal.location.id,
                              name: locationFormModal.location.name,
                              code: locationFormModal.location.code,
                              type: "OFFLINE",
                              capacity: locationFormModal.location.capacity.toString(),
                              address: `${locationFormModal.location.floor}, ${locationFormModal.location.building}`,
                              onlineLink: "",
                              departmentId: "",
                          }
                        : undefined
                }
            />

            <DeleteLocationModal
                isOpen={deleteModal.isOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                location={deleteModal.location}
            />
        </>
    );
};

export default PhongHopPage;
