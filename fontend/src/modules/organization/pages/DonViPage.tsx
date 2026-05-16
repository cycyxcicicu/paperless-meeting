import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/common/components/layout/PageHeader";
import {Users,Building2,X,ChevronDown,ChevronRight,Building,Check,Info,} from "lucide-react";
import { UnitInfoTab } from "@/modules/organization/components/UnitInfoTab";
import { ChildUnitsTab } from "@/modules/organization/components/ChildUnitsTab";
import { UnitUsersTab } from "@/modules/organization/components/UnitUsersTab";
import { UserFormModal } from "@/modules/user/components/UserFormModal";
import { DeleteUserModal } from "@/modules/user/components/DeleteUserModal";
import { UnitFormModal } from "@/modules/organization/components/UnitFormModal";
import { DeleteUnitModal } from "@/modules/organization/components/DeleteUnitModal";
import { cn } from "@/common/utils/cn";
import { toast } from "@/lib/toast";
import { StatCard } from "@/common/components/ui/StatCard";
import {
    treeData as initialTreeData,
    allUnits,
    unitDetailsDatabase,
    allUnitUsers,
    TreeNode,
} from "../data/mockData";

type TabKey = "info" | "child-units" | "users";

const DonViPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTreeNode, setSelectedTreeNode] = useState<string>("root");

    // Detail panel state
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("info");
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // Filter state
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // User modal state
    const [userFormModal, setUserFormModal] = useState<{
        isOpen: boolean;
        mode: "create" | "edit" | "view";
        userId?: number;
        defaultUnitId?: string;
    }>({ isOpen: false, mode: "create" });

    const [deleteUserModal, setDeleteUserModal] = useState<{
        isOpen: boolean;
        userId?: number;
    }>({ isOpen: false });

    // Unit modal state
    const [unitFormModal, setUnitFormModal] = useState<{
        isOpen: boolean;
        mode: "create" | "edit" | "view";
        unitId?: string;
    }>({ isOpen: false, mode: "create" });

    const [deleteUnitModal, setDeleteUnitModal] = useState<{
        isOpen: boolean;
        unitId?: string;
    }>({ isOpen: false });

    const [treeData, setTreeData] = useState<TreeNode[]>(initialTreeData);

    // Auto-select first unit on mount
    useEffect(() => {
        // Select root node and show its detail
        const rootNode = treeData[0];
        if (rootNode && rootNode.code) {
            setSelectedTreeNode(rootNode.id);
            setSelectedUnitId(rootNode.code);
            setIsPanelOpen(true);
            setActiveTab("info");
        }
    }, []); 
    // Filter units
    const filteredUnits = allUnits.filter((unit) => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                unit.name.toLowerCase().includes(query) ||
                unit.code.toLowerCase().includes(query) ||
                unit.address.toLowerCase().includes(query);

            if (!matchesSearch) return false;
        }

        // Status filter
        if (filterStatus !== "all") {
            if (filterStatus === "active" && !unit.isActive) return false;
            if (filterStatus === "inactive" && unit.isActive) return false;
        }

        return true;
    });

    const totalItems = filteredUnits.length;

    // Tree functions
    const toggleTreeNode = (nodeId: string, nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((node) => {
            if (node.id === nodeId) {
                return { ...node, isExpanded: !node.isExpanded };
            }
            if (node.children) {
                return {
                    ...node,
                    children: toggleTreeNode(nodeId, node.children),
                };
            }
            return node;
        });
    };

    const handleTreeNodeClick = (nodeId: string) => {
        setSelectedTreeNode(nodeId);
        // Find node code to open detail
        const node = findNodeById(treeData, nodeId);
        if (node && node.code) {
            handleViewDetails(node.code);
        }
    };

    const handleTreeNodeToggle = (nodeId: string) => {
        setTreeData(toggleTreeNode(nodeId, treeData));
    };

    const renderTreeNode = (node: TreeNode) => {
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
                    animate={{
                        backgroundColor: isSelected
                            ? "rgba(200, 16, 46, 0.05)"
                            : "rgba(255, 255, 255, 0)",
                    }}
                    transition={{ duration: 0.2 }}
                >
                    {hasChildren ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleTreeNodeToggle(node.id);
                            }}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors flex-shrink-0"
                        >
                            {node.isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                    ) : (
                        <span className="w-5" />
                    )}
                    <Building2
                        className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-[#C8102E]" : "text-gray-400"}`}
                    />
                    <span className="text-sm truncate flex-1">{node.name}</span>
                </motion.div>
                {hasChildren && node.isExpanded && (
                    <div>
                        {node.children!.map((child) => renderTreeNode(child))}
                    </div>
                )}
            </div>
        );
    };

    React.useEffect(() => {
        // Reset search when filter changes
    }, [searchQuery, filterStatus]);

    const activeUnits = filteredUnits.filter((u) => u.isActive).length;

    const getActiveFiltersCount = () => {
        let count = 0;
        if (searchQuery) count++;
        if (filterStatus !== "all") count++;
        return count;
    };

    const activeFiltersCount = getActiveFiltersCount();

    // Get selected node info
    const findNodeById = (nodes: TreeNode[], id: string): TreeNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const findNodeByCode = (
        nodes: TreeNode[],
        code: string,
    ): TreeNode | null => {
        for (const node of nodes) {
            if (node.code === code) return node;
            if (node.children) {
                const found = findNodeByCode(node.children, code);
                if (found) return found;
            }
        }
        return null;
    };

    const selectedNode = findNodeById(treeData, selectedTreeNode);

    // Handler to open detail panel
    const handleViewDetails = (unitCode: string) => {
        setIsLoadingDetail(true);
        setSelectedUnitId(unitCode);
        setIsPanelOpen(true);
        setActiveTab("info"); // Reset to info tab when opening

        // Simulate loading for smooth transition
        setTimeout(() => {
            setIsLoadingDetail(false);
        }, 200);
    };

    // Handler to close detail panel
    const handleClosePanel = () => {
        setIsPanelOpen(false);
        // Delay clearing selected unit to allow animation to complete
        setTimeout(() => setSelectedUnitId(null), 300);
    };

    // Get current unit details
    const currentUnitDetails = selectedUnitId
        ? unitDetailsDatabase[selectedUnitId]
        : null;

    // Get child units from tree data
    const getChildUnitsFromTree = (unitId: string | null): any[] => {
        if (!unitId) return [];

        const node = findNodeByCode(treeData, unitId);
        if (!node || !node.children) return [];

        return node.children.map((child) => {
            // Try to parse id as number, fallback to hash of id string
            let numericId: number;
            const parsedId = parseInt(child.id);
            if (!isNaN(parsedId)) {
                numericId = parsedId;
            } else {
                // Create a simple hash from string id
                numericId = child.id
                    .split("")
                    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
            }

            // Get rich data from database if available
            const detail = unitDetailsDatabase[child.code];

            return {
                id: numericId,
                name: child.name,
                code: child.code,
                address: detail?.address || "",
                phone: detail?.phone || "",
                email: detail?.email || "",
                foundedDate: detail?.establishedDate || "",
                director: detail?.director || "",
                totalMembers: detail?.totalMembers || 0,
                totalChildUnits: detail?.totalChildUnits || 0,
                isActive: detail?.isActive !== undefined ? detail.isActive : true,
            };
        });
    };

    const currentChildUnits = getChildUnitsFromTree(selectedUnitId);
    const currentUnitUsers = selectedUnitId
        ? allUnitUsers[selectedUnitId] || []
        : [];

    const selectedDetailNode = findNodeByCode(
        treeData,
        selectedUnitId || "UBND_HP",
    );
    const level = selectedDetailNode?.level || 0;

    let infoLabel = "Thông tin đơn vị";
    let childrenLabel = "Đơn vị trực thuộc";
    let childUnitTypeLabel = "đơn vị trực thuộc";

    if (level === 1) {
        infoLabel = "Thông tin sở";
        childrenLabel = "Phòng ban trực thuộc";
        childUnitTypeLabel = "phòng ban trực thuộc";
    } else if (level >= 2) {
        infoLabel = "Thông tin phòng ban";
        childrenLabel = "Bộ phận trực thuộc";
        childUnitTypeLabel = "bộ phận trực thuộc";
    }

    // Detail panel tabs configuration
    const detailTabs = [
        {
            key: "info" as TabKey,
            label: infoLabel,
            icon: Info,
        },
        {
            key: "child-units" as TabKey,
            label: childrenLabel,
            icon: Building2,
            count: currentChildUnits.length,
        },
        {
            key: "users" as TabKey,
            label: "Danh sách nhân sự",
            icon: Users,
            count: currentUnitUsers.length,
        },
    ];

    // User modal handlers
    const handleAddUser = () => {
        setUserFormModal({
            isOpen: true,
            mode: "create",
            defaultUnitId: selectedUnitId || undefined,
        });
    };

    const handleViewUser = (userId: number) => {
        setUserFormModal({
            isOpen: true,
            mode: "view",
            userId,
            defaultUnitId: selectedUnitId || undefined,
        });
    };

    const handleEditUser = (userId: number) => {
        setUserFormModal({
            isOpen: true,
            mode: "edit",
            userId,
            defaultUnitId: selectedUnitId || undefined,
        });
    };

    const handleDeleteUser = (userId: number) => {
        setDeleteUserModal({
            isOpen: true,
            userId,
        });
    };

    const handleCloseUserFormModal = () => {
        setUserFormModal({ isOpen: false, mode: "create" });
    };

    const handleCloseDeleteUserModal = () => {
        setDeleteUserModal({ isOpen: false });
    };

    const handleSubmitUserForm = (userData: any) => {
        console.log("User form submitted:", userData);
        // TODO: Call API to create/update user

        if (userFormModal.mode === "create") {
            toast.success(
                "Thêm người dùng thành công",
                `Đã thêm người dùng ${userData.fullName} vào hệ thống`,
            );
        } else if (userFormModal.mode === "edit") {
            toast.success(
                "Cập nhật người dùng thành công",
                `Thông tin người dùng ${userData.fullName} đã được cập nhật`,
            );
        }

        handleCloseUserFormModal();
    };

    const handleConfirmDeleteUser = () => {
        console.log("Delete user:", deleteUserModal.userId);
        const user = currentUnitUsers.find(
            (u) => u.id === deleteUserModal.userId,
        );

        // TODO: Call API to delete user

        if (user) {
            toast.success(
                "Xóa người dùng thành công",
                `Đã xóa người dùng ${user.fullName} khỏi hệ thống`,
            );
        }

        handleCloseDeleteUserModal();
    };

    // Helper function to add node to tree
    const addNodeToTree = (
        tree: TreeNode[],
        parentId: string,
        newNode: TreeNode,
    ): TreeNode[] => {
        return tree.map((node) => {
            if (node.id === parentId) {
                const updatedChildren = node.children || [];
                return {
                    ...node,
                    children: [...updatedChildren, newNode],
                    isExpanded: true, // Auto expand parent when adding child
                };
            }
            if (node.children) {
                return {
                    ...node,
                    children: addNodeToTree(node.children, parentId, newNode),
                };
            }
            return node;
        });
    };

    // Helper function to update node in tree
    const updateNodeInTree = (
        tree: TreeNode[],
        nodeId: string,
        updates: Partial<TreeNode>,
    ): TreeNode[] => {
        return tree.map((node) => {
            if (node.id === nodeId) {
                return { ...node, ...updates };
            }
            if (node.children) {
                return {
                    ...node,
                    children: updateNodeInTree(node.children, nodeId, updates),
                };
            }
            return node;
        });
    };

    // Helper function to delete node from tree
    const deleteNodeFromTree = (
        tree: TreeNode[],
        nodeId: string,
    ): TreeNode[] => {
        return tree.reduce((acc, node) => {
            if (node.id === nodeId) {
                return acc; // Skip this node (delete it)
            }
            if (node.children) {
                return [
                    ...acc,
                    {
                        ...node,
                        children: deleteNodeFromTree(node.children, nodeId),
                    },
                ];
            }
            return [...acc, node];
        }, [] as TreeNode[]);
    };

    // Unit modal handlers
    const handleOpenAddUnitModal = () => {
        console.log("Opening add unit modal, selectedUnitId:", selectedUnitId);
        setUnitFormModal({ isOpen: true, mode: "create" });
    };

    const handleOpenEditUnitModal = (unitId: number) => {
        // Find the actual string id from tree by matching the numeric id
        const node = findNodeByCode(treeData, selectedUnitId || "UBND_HP");
        if (node?.children) {
            const child = node.children.find((c) => {
                const parsedId = parseInt(c.id);
                if (!isNaN(parsedId)) return parsedId === unitId;
                const hashId = c.id
                    .split("")
                    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                return hashId === unitId;
            });
            if (child) {
                setUnitFormModal({
                    isOpen: true,
                    mode: "edit",
                    unitId: child.id,
                });
            }
        }
    };

    const handleOpenDeleteUnitModal = (unitId: number) => {
        // Find the actual string id from tree by matching the numeric id
        const node = findNodeByCode(treeData, selectedUnitId || "UBND_HP");
        if (node?.children) {
            const child = node.children.find((c) => {
                const parsedId = parseInt(c.id);
                if (!isNaN(parsedId)) return parsedId === unitId;
                const hashId = c.id
                    .split("")
                    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                return hashId === unitId;
            });
            if (child) {
                setDeleteUnitModal({ isOpen: true, unitId: child.id });
            }
        }
    };

    const handleCloseUnitFormModal = () => {
        setUnitFormModal({ isOpen: false, mode: "create" });
    };

    const handleCloseDeleteUnitModal = () => {
        setDeleteUnitModal({ isOpen: false });
    };

    const handleSubmitUnitForm = (unitData: any) => {
        if (unitFormModal.mode === "create") {
            // Generate new ID
            const newId = `${selectedUnitId}-${Date.now()}`;
            const parentNode = findNodeById(treeData, selectedUnitId || "root");
            const parentLevel = parentNode?.level ?? 0;

            // Create new tree node
            const newNode: TreeNode = {
                id: newId,
                name: unitData.name,
                code: unitData.code,
                level: parentLevel + 1,
            };

            // Update tree
            const updatedTree = addNodeToTree(
                treeData,
                selectedUnitId || "root",
                newNode,
            );
            setTreeData(updatedTree);

            toast.success(
                "Thêm đơn vị thành công",
                `Đã thêm đơn vị "${unitData.name}" vào hệ thống`,
            );
            // TODO: Call API to create unit
        } else if (unitFormModal.mode === "edit" && unitFormModal.unitId) {
            // Update tree node
            const updatedTree = updateNodeInTree(
                treeData,
                unitFormModal.unitId,
                {
                    name: unitData.name,
                    code: unitData.code,
                },
            );
            setTreeData(updatedTree);

            toast.success(
                "Cập nhật đơn vị thành công",
                `Thông tin đơn vị "${unitData.name}" đã được cập nhật`,
            );
            // TODO: Call API to update unit
        }

        handleCloseUnitFormModal();
    };

    const handleConfirmDeleteUnit = () => {
        if (!deleteUnitModal.unitId) return;

        // Get unit name before deleting for toast message
        const unitToDelete = findNodeById(treeData, deleteUnitModal.unitId);
        const unitName = unitToDelete?.name || "đơn vị";

        // Remove from tree
        const updatedTree = deleteNodeFromTree(
            treeData,
            deleteUnitModal.unitId,
        );
        setTreeData(updatedTree);

        // If deleted unit was selected, clear selection
        if (selectedUnitId === deleteUnitModal.unitId) {
            setSelectedUnitId(null);
            setIsPanelOpen(false);
            setSelectedTreeNode("root");
        }

        toast.success(
            "Xóa đơn vị thành công",
            `Đã xóa đơn vị "${unitName}" khỏi hệ thống`,
        );
        // TODO: Call API to delete unit

        handleCloseDeleteUnitModal();
    };

    // Get user for delete modal
    const userToDelete = deleteUserModal.userId
        ? currentUnitUsers.find((u) => u.id === deleteUserModal.userId)
        : undefined;

    // Convert user to DeleteUserModal format
    const deleteUserData = userToDelete
        ? {
              username: userToDelete.username,
              fullName: userToDelete.fullName,
              email: userToDelete.email,
              department: currentUnitDetails?.name || "",
          }
        : undefined;

    // Get user for form modal
    const userForForm = userFormModal.userId
        ? currentUnitUsers.find((u) => u.id === userFormModal.userId)
        : undefined;

    // Convert user to UserFormModal format
    const userFormData = userForForm
        ? {
              id: userForForm.id,
              username: userForForm.username,
              fullName: userForForm.fullName,
              email: userForForm.email,
              phone: userForForm.phone,
              position: userForForm.position,
              department: selectedUnitId || "",
              status: (userForForm.isActive ? "active" : "inactive") as
                  | "active"
                  | "inactive",
          }
        : undefined;

    // Get unit for form modal
    const unitForForm = unitFormModal.unitId
        ? findNodeById(treeData, unitFormModal.unitId)
        : undefined;

    // Convert unit to UnitFormModal format
    const unitFormData = unitForForm
        ? {
              id: unitForForm.id,
              name: unitForForm.name,
              code: unitForForm.code,
              address: "", // TODO: Get from unitDetailsDatabase
              phone: "",
              email: "",
              foundedDate: "",
              status: "active" as "active" | "inactive",
              description: "",
          }
        : undefined;

    // Get unit for delete modal
    const unitToDelete = deleteUnitModal.unitId
        ? findNodeById(treeData, deleteUnitModal.unitId)
        : undefined;

    // Convert unit to DeleteUnitModal format
    const deleteUnitData = unitToDelete
        ? {
              name: unitToDelete.name,
              code: unitToDelete.code,
          }
        : undefined;

    return (
        <>
            <div className="bg-gray-50/50">
                <div className="p-8">
                    {/* Page Header */}
                    <PageHeader
                        breadcrumbs={[
                            { name: "Trang chủ", path: "/" },
                            { name: "Quản lý", path: "/nguoi-dung" },
                            { name: "Quản lý đơn vị" },
                        ]}
                    />

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <StatCard
                            title="Tổng số đơn vị"
                            value={totalItems}
                            icon={<Building2 />}
                            color="blue"
                            hasFilters={activeFiltersCount > 0}
                        />
                        <StatCard
                            title="Đang hoạt động"
                            value={activeUnits}
                            icon={<Check />}
                            color="emerald"
                        />
                        <StatCard
                            title="Đơn vị được chọn"
                            value={selectedNode?.name || "Chưa chọn"}
                            icon={<Building />}
                            color="#C8102E"
                            valueSize="18px"
                        />
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
                                    <p className="text-xs text-gray-500 mt-1">
                                        Chọn đơn vị để xem chi tiết
                                    </p>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {treeData.map((node) =>
                                        renderTreeNode(node),
                                    )}
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
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 25,
                                            duration: 0.3,
                                        }}
                                        className="bg-white rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-center"
                                        style={{ minHeight: "600px" }}
                                    >
                                        <div className="text-center px-6 py-12">
                                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                <Building2 className="h-12 w-12 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg btn-primary text-gray-900 mb-2">
                                                Chọn một đơn vị để xem chi tiết
                                            </h3>
                                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                                Chọn một đơn vị từ cây tổ chức
                                                bên trái để xem thông tin chi
                                                tiết, đơn vị con và danh sách
                                                nhân sự
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="detail"
                                        initial={{
                                            opacity: 0,
                                            y: 30,
                                            scale: 0.98,
                                        }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{
                                            opacity: 0,
                                            y: -20,
                                            scale: 0.98,
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 25,
                                            duration: 0.3,
                                        }}
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
                                                    <p className="text-sm text-gray-600 body">
                                                        Đang tải...
                                                    </p>
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
                                                            <h2 className="text-xl heading text-gray-900 truncate">
                                                                {
                                                                    currentUnitDetails.name
                                                                }
                                                            </h2>
                                                            <p className="text-sm text-gray-500">
                                                                Mã:{" "}
                                                                <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    {
                                                                        currentUnitDetails.code
                                                                    }
                                                                </code>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {currentUnitDetails.parentName && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 pl-15">
                                                            <ChevronRight className="h-3 w-3" />
                                                            <span>
                                                                Trực thuộc:{" "}
                                                                {
                                                                    currentUnitDetails.parentName
                                                                }
                                                            </span>
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
                                                    const isActive =
                                                        activeTab === tab.key;
                                                    return (
                                                        <button
                                                            key={tab.key}
                                                            onClick={() =>
                                                                setActiveTab(
                                                                    tab.key,
                                                                )
                                                            }
                                                            className={cn(
                                                                "relative px-4 py-2.5 flex items-center gap-2 text-sm btn-primary rounded-lg transition-all",
                                                                isActive
                                                                    ? "bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white shadow-md"
                                                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                                                            )}
                                                        >
                                                            <tab.icon className="h-4 w-4" />
                                                            <span>
                                                                {tab.label}
                                                            </span>
                                                            {tab.count !==
                                                                undefined && (
                                                                <span
                                                                    className={cn(
                                                                        "px-1.5 py-0.5 rounded text-xs heading",
                                                                        isActive
                                                                            ? "bg-white/20 text-white"
                                                                            : "bg-gray-200 text-gray-600",
                                                                    )}
                                                                >
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
                                                    initial={{
                                                        opacity: 0,
                                                        y: 10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        y: -10,
                                                    }}
                                                    transition={{
                                                        duration: 0.2,
                                                    }}
                                                    className="h-full flex flex-col min-h-[400px]"
                                                >
                                                    {activeTab === "info" &&
                                                        currentUnitDetails && (
                                                            <UnitInfoTab
                                                                unit={
                                                                    currentUnitDetails
                                                                }
                                                            />
                                                        )}
                                                    {activeTab ===
                                                        "child-units" && (
                                                        <ChildUnitsTab
                                                            units={
                                                                currentChildUnits
                                                            }
                                                            label={
                                                                childUnitTypeLabel
                                                            }
                                                            onAdd={
                                                                handleOpenAddUnitModal
                                                            }
                                                            onEdit={
                                                                handleOpenEditUnitModal
                                                            }
                                                            onDelete={
                                                                handleOpenDeleteUnitModal
                                                            }
                                                        />
                                                    )}
                                                    {activeTab === "users" && (
                                                        <UnitUsersTab
                                                            users={
                                                                currentUnitUsers
                                                            }
                                                            onAdd={
                                                                handleAddUser
                                                            }
                                                            onView={
                                                                handleViewUser
                                                            }
                                                            onEdit={
                                                                handleEditUser
                                                            }
                                                            onDelete={
                                                                handleDeleteUser
                                                            }
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
