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
import { useLocation } from '../hooks/useLocation';
import { locationApi } from '../services/location.api';
import { useAuth } from '@/app/context/AuthContext';

const PhongHopPage = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role?.roleCode === 'SUPER_ADMIN';

    const {
        locations,
        totalItems,
        stats,
        loading,
        searchQuery,
        setSearchQuery,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        fetchLocations,
        createLocation,
        updateLocation,
        deleteLocation
    } = useLocation();

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

    const handleOpenLocationModal = async (mode: 'view' | 'edit', id: string) => {
        try {
            const response = await locationApi.getLocationById(id);
            if (response.success && response.data) {
                setLocationFormModal({ isOpen: true, mode, location: response.data as any });
            } else {
                toast.error('Lỗi', response.message || 'Không thể lấy thông tin chi tiết');
            }
        } catch (error: any) {
            toast.error('Lỗi', error.message || 'Không thể lấy thông tin chi tiết từ máy chủ');
        }
    };

    const handleView = (id: string) => {
        handleOpenLocationModal('view', id);
    };

    const handleEdit = (id: string) => {
        handleOpenLocationModal('edit', id);
    };

    const handleDelete = (id: string) => {
        const location = locations.find((l) => l.id === id);
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

    const handleSubmitLocationForm = async (data: any) => {
        try {
            if (locationFormModal.mode === "create") {
                await createLocation(data);
            } else if (locationFormModal.mode === "edit" && locationFormModal.location) {
                await updateLocation(locationFormModal.location.id, data);
            }
            handleCloseLocationFormModal();
        } catch (error) {
            // Keep modal open, errors shown by hook via toast
            throw error;
        }
    };

    const handleConfirmDelete = async () => {
        if (deleteModal.location) {
            const success = await deleteLocation(deleteModal.location.id);
            if (success) {
                handleCloseDeleteModal();
            }
        }
    };

    const handleRefresh = () => {
        fetchLocations();
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
        isSuperAdmin
    }), [isSuperAdmin, locations]);

    const tableConfig = {
        columns,
        rowActions,
    };

    return (
        <div className="p-8">
            <PageHeader
                breadcrumbs={[
                    { name: "Trang chủ", path: "/" },
                    { name: "Phòng họp", path: "/phong-hop" },
                    { name: "Địa điểm họp" },
                ]}
            />

            <LocationSummary
                totalLocations={stats.totalLocations}
                totalCapacity={stats.totalCapacity}
                activeLocations={stats.activeLocations}
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
                    data={locations}
                    config={tableConfig}
                    isLoading={loading}
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
                location={deleteModal.location as any}
            />
        </div>
    );
};

export default PhongHopPage;
