import { clsx, type ClassValue } from "clsx";
import { ChevronLeft, ChevronRight, Home, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { toast } from '@/lib/toast';
import { DeleteLocationModal } from '@/modules/meeting-rooms/components/DeleteLocationModal';
import { LocationEmptyState } from '@/modules/meeting-rooms/components/LocationEmptyState';
import { LocationFormModal } from '@/modules/meeting-rooms/components/LocationFormModal';
import { LocationSummary } from '@/modules/meeting-rooms/components/LocationSummary';
import {
    LocationTable,
    MeetingLocation,
} from '@/modules/meeting-rooms/components/LocationTable';
import { LocationToolbar } from '@/modules/meeting-rooms/components/LocationToolbar';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { Pagination } from '@/common/components/ui/app-pagination';

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
        <div className="p-8">
            {/* Page Header */}
            <PageHeader
                breadcrumbs={[
                    { name: "Trang chủ", path: "/" },
                    { name: "Phòng họp", path: "/phong-hop" },
                    { name: "Địa điểm họp" },
                ]}
                actions={
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="h-4 w-4 text-[#C8102E]" />
                        <span className="body text-gray-700">
                            Cập nhật: 17/04/2026
                        </span>
                    </div>
                }
            />

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
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    totalItems={filteredLocations.length}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={setPageSize}
                                    itemLabel="địa điểm"
                                />
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
