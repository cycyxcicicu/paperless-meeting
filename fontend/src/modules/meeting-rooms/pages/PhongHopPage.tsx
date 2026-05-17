import { MapPin, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from '@/lib/toast';
import { DeleteLocationModal } from '@/modules/meeting-rooms/components/DeleteLocationModal';
import { LocationFormModal } from '@/modules/meeting-rooms/components/LocationFormModal';
import { LocationSummary } from '@/modules/meeting-rooms/components/LocationSummary';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { createMeetingRoomColumns, createMeetingRoomRowActions, MeetingRoom } from '../table/meetingRoomTable.schema';
import { DataToolbar } from "@/common/components/table-engine/DataToolbar";

const mockLocations: MeetingRoom[] = [
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
        location?: MeetingRoom;
    }>({ isOpen: false, mode: "create" });

    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        location?: MeetingRoom;
    }>({ isOpen: false });

    // Handlers
    const handleAddNew = () => {
        setLocationFormModal({ isOpen: true, mode: "create" });
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

    const handleCloseLocationFormModal = () => {
        setLocationFormModal({ isOpen: false, mode: "create" });
    };

    const handleCloseDeleteModal = () => {
        setDeleteModal({ isOpen: false });
    };

    const handleSubmitLocationForm = (data: any) => {
        if (locationFormModal.mode === "create") {
            toast.success("Thêm thành công", `Đã thêm phòng họp "${data.name}"`);
        } else {
            toast.success("Cập nhật thành công", `Đã cập nhật phòng họp "${data.name}"`);
        }
        handleCloseLocationFormModal();
    };

    const handleConfirmDelete = () => {
        if (deleteModal.location) {
            toast.success("Xóa thành công", `Đã xóa phòng họp "${deleteModal.location.name}"`);
        }
        handleCloseDeleteModal();
    };

    const handleRefresh = () => {
        toast.success("Làm mới dữ liệu", "Danh sách phòng họp đã được cập nhật");
    };

    // Table Config
    const columns = useMemo(() => createMeetingRoomColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
    }), []);

    const rowActions = useMemo(() => createMeetingRoomRowActions({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
    }), []);

    const tableConfig = {
        columns,
        rowActions,
    };

    // Filtering
    const filteredData = useMemo(() => {
        return mockLocations.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const totalItems = filteredData.length;
    
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage, pageSize]);

    const totalCapacity = mockLocations.reduce((acc, loc) => acc + loc.capacity, 0);
    const activeLocations = mockLocations.filter((loc) => loc.status === "active").length;
    const recentlyUsed = mockLocations.filter((loc) => loc.lastUsed).length;

    return (
        <div className="p-8">
            <PageHeader
                breadcrumbs={[
                    { name: "Trang chủ", path: "/" },
                    { name: "Phòng họp", path: "/phong-hop" },
                    { name: "Địa điểm họp" },
                ]}
                actions={
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="h-4 w-4 text-[#C8102E]" />
                        <span className="body text-gray-700">Cập nhật: 17/04/2026</span>
                    </div>
                }
            />

            <LocationSummary
                totalLocations={mockLocations.length}
                totalCapacity={totalCapacity}
                activeLocations={activeLocations}
                recentlyUsed={recentlyUsed}
            />

            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <DataToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Tìm kiếm theo tên hoặc mã phòng..."
                    onRefresh={handleRefresh}
                    primaryAction={{
                        label: "Thêm phòng họp mới",
                        icon: <Plus className="h-4 w-4" />,
                        onClick: handleAddNew
                    }}
                />

                <DataTable
                    data={paginatedData}
                    config={tableConfig}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />
            </div>

            <LocationFormModal
                isOpen={locationFormModal.isOpen}
                onClose={handleCloseLocationFormModal}
                onSubmit={handleSubmitLocationForm}
                mode={locationFormModal.mode}
                initialData={locationFormModal.location}
            />

            <DeleteLocationModal
                isOpen={deleteModal.isOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                location={deleteModal.location}
            />
        </div>
    );
};

export default PhongHopPage;
