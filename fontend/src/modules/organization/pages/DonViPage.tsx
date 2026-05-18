import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/common/components/layout/PageHeader";
import { Users, Building2, Building, Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { UnitInfoTab } from "@/modules/organization/components/UnitInfoTab";
import { ChildUnitsTab } from "@/modules/organization/components/ChildUnitsTab";
import { UnitUsersTab } from "@/modules/organization/components/UnitUsersTab";
import { UserFormModal } from "@/modules/user/components/UserFormModal";
import { DeleteUserModal } from "@/modules/user/components/DeleteUserModal";
import { UnitFormModal } from "@/modules/organization/components/UnitFormModal";
import { DeleteUnitModal } from "@/modules/organization/components/DeleteUnitModal";
import { cn } from "@/common/utils/cn";
import { StatCard } from "@/common/components/ui/StatCard";
import { useDonVi } from "../hooks/useDonVi";
import { TreeNode } from "../data/mockData";

const DonViPage = () => {
    const {
        searchQuery, setSearchQuery,
        filterStatus, setFilterStatus,
        selectedTreeNode, activeTab, setActiveTab,
        isPanelOpen, isLoadingDetail,
        treeData,
        totalItems, activeUnits, activeFiltersCount,
        selectedNode, currentUnitDetails,
        currentChildUnits, currentUnitUsers,
        childUnitTypeLabel, detailTabs,
        userFormModal, deleteUserModal, unitFormModal, deleteUnitModal,
        userFormData, deleteUserData, unitFormData, deleteUnitData,
        lockedUnit,
        handleTreeNodeClick, handleTreeNodeToggle,
        handleClosePanel,
        handleAddUser, handleViewUser, handleEditUser, handleDeleteUser,
        handleCloseUserFormModal, handleCloseDeleteUserModal,
        handleSubmitUserForm, handleConfirmDeleteUser,
        handleOpenAddUnitModal, handleOpenEditUnitModal, handleOpenDeleteUnitModal,
        handleCloseUnitFormModal, handleCloseDeleteUnitModal,
        handleSubmitUnitForm, handleConfirmDeleteUnit,
        findNodeById,
    } = useDonVi();

    const renderTreeNode = (node: TreeNode): React.ReactNode => {
        const isSelected = selectedTreeNode === node.id;
        const hasChildren = node.children && node.children.length > 0;
        const paddingLeft = node.level * 20 + 12;

        return (
            <div key={node.id}>
                <motion.div
                    className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-l-4 ${
                        isSelected
                            ? "bg-gradient-to-r from-[#C8102E]/10 to-[#A90F14]/10 text-[#C8102E] btn-primary border-[#C8102E]"
                            : "text-gray-700 hover:bg-gray-50 border-transparent"
                    }`}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                    onClick={() => handleTreeNodeClick(node.id)}
                    initial={false}
                    animate={{ backgroundColor: isSelected ? "rgba(200, 16, 46, 0.05)" : "rgba(255, 255, 255, 0)" }}
                    transition={{ duration: 0.2 }}
                >
                    {hasChildren ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleTreeNodeToggle(node.id); }}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors flex-shrink-0"
                        >
                            {node.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                    ) : (
                        <span className="w-5" />
                    )}
                    <Building2 className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-[#C8102E]" : "text-gray-400"}`} />
                    <span className="text-sm truncate flex-1">{node.name}</span>
                </motion.div>
                {hasChildren && node.isExpanded && (
                    <div>{node.children!.map((child) => renderTreeNode(child))}</div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="bg-gray-50/50">
                <div className="p-8">
                    <PageHeader
                        breadcrumbs={[
                            { name: "Trang chủ", path: "/" },
                            { name: "Quản lý", path: "/nguoi-dung" },
                            { name: "Quản lý đơn vị" },
                        ]}
                    />

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <StatCard title="Tổng số đơn vị" value={totalItems} icon={<Building2 />} color="blue" hasFilters={activeFiltersCount > 0} />
                        <StatCard title="Đang hoạt động" value={activeUnits} icon={<Check />} color="emerald" />
                        <StatCard title="Đơn vị được chọn" value={selectedNode?.name || "Chưa chọn"} icon={<Building />} color="#C8102E" valueSize="18px" />
                    </div>

                    {/* Split Panel Layout */}
                    <div className="grid grid-cols-12 gap-6">
                        {/* Left Panel - Tree Navigation */}
                        <div className="col-span-4">
                            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm h-[calc(100vh-28rem)] flex flex-col">
                                <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-200/60 px-5 py-4 z-10">
                                    <h3 className="btn-primary text-gray-900 flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-[#C8102E]" />
                                        Cơ cấu tổ chức
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Chọn đơn vị để xem chi tiết</p>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {treeData.map((node) => renderTreeNode(node))}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Empty State or Detail */}
                        <div className="col-span-8">
                            <AnimatePresence mode="wait">
                                {!isPanelOpen || !currentUnitDetails ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.3 }}
                                        className="bg-white rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-center"
                                        style={{ minHeight: "600px" }}
                                    >
                                        <div className="text-center px-6 py-12">
                                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                <Building2 className="h-12 w-12 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg btn-primary text-gray-900 mb-2">Chọn một đơn vị để xem chi tiết</h3>
                                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                                Chọn một đơn vị từ cây tổ chức bên trái để xem thông tin chi tiết, đơn vị con và danh sách nhân sự
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="detail"
                                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.3 }}
                                        className="bg-white rounded-2xl border border-gray-200/60 shadow-sm flex flex-col relative overflow-hidden"
                                    >
                                        {/* Loading Overlay */}
                                        {isLoadingDetail && (
                                            <motion.div
                                                className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
                                                    <p className="text-sm text-gray-600 body">Đang tải...</p>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Panel Header */}
                                        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white shrink-0">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C8102E] to-[#A90F14] flex items-center justify-center flex-shrink-0 shadow-md">
                                                            <Building2 className="h-6 w-6 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h2 className="text-xl heading text-gray-900 truncate">{currentUnitDetails.name}</h2>
                                                            <p className="text-sm text-gray-500">
                                                                Mã:{" "}
                                                                <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{currentUnitDetails.code}</code>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {currentUnitDetails.parentName && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 pl-15">
                                                            <ChevronRight className="h-3 w-3" />
                                                            <span>Trực thuộc: {currentUnitDetails.parentName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={handleClosePanel}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all flex-shrink-0"
                                                    title="Đóng"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>

                                            {/* Tabs */}
                                            <div className="flex items-center gap-2">
                                                {detailTabs.map((tab) => {
                                                    const isActive = activeTab === tab.key;
                                                    return (
                                                        <button
                                                            key={tab.key}
                                                            onClick={() => setActiveTab(tab.key)}
                                                            className={cn(
                                                                "relative px-4 py-2.5 flex items-center gap-2 text-sm btn-primary rounded-lg transition-all",
                                                                isActive
                                                                    ? "bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white shadow-md"
                                                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                            )}
                                                        >
                                                            <tab.icon className="h-4 w-4" />
                                                            <span>{tab.label}</span>
                                                            {tab.count !== undefined && (
                                                                <span className={cn("px-1.5 py-0.5 rounded text-xs heading", isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600")}>
                                                                    {tab.count}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Panel Content */}
                                        <div className="flex-1 overflow-y-auto">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={activeTab}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="h-full flex flex-col min-h-[400px]"
                                                >
                                                    {activeTab === "info" && currentUnitDetails && (
                                                        <UnitInfoTab unit={currentUnitDetails} />
                                                    )}
                                                    {activeTab === "child-units" && (
                                                        <ChildUnitsTab
                                                            units={currentChildUnits}
                                                            label={childUnitTypeLabel}
                                                            onAdd={handleOpenAddUnitModal}
                                                            onEdit={handleOpenEditUnitModal}
                                                            onDelete={handleOpenDeleteUnitModal}
                                                        />
                                                    )}
                                                    {activeTab === "users" && (
                                                        <UnitUsersTab
                                                            users={currentUnitUsers}
                                                            onAdd={handleAddUser}
                                                            onView={handleViewUser}
                                                            onEdit={handleEditUser}
                                                            onDelete={handleDeleteUser}
                                                        />
                                                    )}
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Modals */}
            <UserFormModal
                isOpen={userFormModal.isOpen}
                onClose={handleCloseUserFormModal}
                onSubmit={handleSubmitUserForm}
                mode={userFormModal.mode}
                initialData={userFormData}
                defaultUnitId={userFormModal.defaultUnitId}
                lockedUnit={lockedUnit}
            />
            <DeleteUserModal
                isOpen={deleteUserModal.isOpen}
                onClose={handleCloseDeleteUserModal}
                onConfirm={handleConfirmDeleteUser}
                user={deleteUserData}
            />

            {/* Unit Modals */}
            <UnitFormModal
                isOpen={unitFormModal.isOpen}
                onClose={handleCloseUnitFormModal}
                onSubmit={handleSubmitUnitForm}
                mode={unitFormModal.mode}
                initialData={unitFormData}
                parentUnitName={currentUnitDetails?.name}
                unitTypeLabel={childUnitTypeLabel}
            />
            <DeleteUnitModal
                isOpen={deleteUnitModal.isOpen}
                onClose={handleCloseDeleteUnitModal}
                onConfirm={handleConfirmDeleteUnit}
                unit={deleteUnitData}
            />
        </>
    );
};

export default DonViPage;
