import { useState, useEffect } from "react";
import {
    treeData as initialTreeData,
    allUnits,
    unitDetailsDatabase,
    allUnitUsers,
    TreeNode,
} from "../data/mockData";
import { toast } from "@/lib/toast";
import { Info, Building2, Users } from "lucide-react";

export type TabKey = "info" | "child-units" | "users";

export function useDonVi() {
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
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                unit.name.toLowerCase().includes(query) ||
                unit.code.toLowerCase().includes(query) ||
                unit.address.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }
        if (filterStatus !== "all") {
            if (filterStatus === "active" && !unit.isActive) return false;
            if (filterStatus === "inactive" && unit.isActive) return false;
        }
        return true;
    });

    const totalItems = filteredUnits.length;
    const activeUnits = filteredUnits.filter((u) => u.isActive).length;

    const getActiveFiltersCount = () => {
        let count = 0;
        if (searchQuery) count++;
        if (filterStatus !== "all") count++;
        return count;
    };
    const activeFiltersCount = getActiveFiltersCount();

    // --- Tree helpers ---
    const toggleTreeNode = (nodeId: string, nodes: TreeNode[]): TreeNode[] =>
        nodes.map((node) => {
            if (node.id === nodeId) return { ...node, isExpanded: !node.isExpanded };
            if (node.children) return { ...node, children: toggleTreeNode(nodeId, node.children) };
            return node;
        });

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

    const findNodeByCode = (nodes: TreeNode[], code: string): TreeNode | null => {
        for (const node of nodes) {
            if (node.code === code) return node;
            if (node.children) {
                const found = findNodeByCode(node.children, code);
                if (found) return found;
            }
        }
        return null;
    };

    const addNodeToTree = (tree: TreeNode[], parentId: string, newNode: TreeNode): TreeNode[] =>
        tree.map((node) => {
            if (node.id === parentId) {
                return { ...node, children: [...(node.children || []), newNode], isExpanded: true };
            }
            if (node.children) return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
            return node;
        });

    const updateNodeInTree = (tree: TreeNode[], nodeId: string, updates: Partial<TreeNode>): TreeNode[] =>
        tree.map((node) => {
            if (node.id === nodeId) return { ...node, ...updates };
            if (node.children) return { ...node, children: updateNodeInTree(node.children, nodeId, updates) };
            return node;
        });

    const deleteNodeFromTree = (tree: TreeNode[], nodeId: string): TreeNode[] =>
        tree.reduce((acc, node) => {
            if (node.id === nodeId) return acc;
            if (node.children) return [...acc, { ...node, children: deleteNodeFromTree(node.children, nodeId) }];
            return [...acc, node];
        }, [] as TreeNode[]);

    // --- Tree handlers ---
    const handleTreeNodeToggle = (nodeId: string) => setTreeData(toggleTreeNode(nodeId, treeData));

    const handleViewDetails = (unitCode: string) => {
        setIsLoadingDetail(true);
        setSelectedUnitId(unitCode);
        setIsPanelOpen(true);
        setActiveTab("info");
        setTimeout(() => setIsLoadingDetail(false), 200);
    };

    const handleTreeNodeClick = (nodeId: string) => {
        setSelectedTreeNode(nodeId);
        const node = findNodeById(treeData, nodeId);
        if (node && node.code) handleViewDetails(node.code);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setTimeout(() => setSelectedUnitId(null), 300);
    };

    // --- Derived data ---
    const selectedNode = findNodeById(treeData, selectedTreeNode);
    const currentUnitDetails = selectedUnitId ? unitDetailsDatabase[selectedUnitId] : null;

    const getChildUnitsFromTree = (unitId: string | null): any[] => {
        if (!unitId) return [];
        const node = findNodeByCode(treeData, unitId);
        if (!node || !node.children) return [];
        return node.children.map((child) => {
            let numericId: number;
            const parsedId = parseInt(child.id);
            if (!isNaN(parsedId)) {
                numericId = parsedId;
            } else {
                numericId = child.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            }
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
    const currentUnitUsers = selectedUnitId ? allUnitUsers[selectedUnitId] || [] : [];

    const selectedDetailNode = findNodeByCode(treeData, selectedUnitId || "UBND_HP");
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

    const detailTabs = [
        { key: "info" as TabKey, label: infoLabel, icon: Info },
        { key: "child-units" as TabKey, label: childrenLabel, icon: Building2, count: currentChildUnits.length },
        { key: "users" as TabKey, label: "Danh sách nhân sự", icon: Users, count: currentUnitUsers.length },
    ];

    // --- User modal handlers ---
    const handleAddUser = () =>
        setUserFormModal({ isOpen: true, mode: "create", defaultUnitId: selectedUnitId || undefined });

    const handleViewUser = (userId: number) =>
        setUserFormModal({ isOpen: true, mode: "view", userId, defaultUnitId: selectedUnitId || undefined });

    const handleEditUser = (userId: number) =>
        setUserFormModal({ isOpen: true, mode: "edit", userId, defaultUnitId: selectedUnitId || undefined });

    const handleDeleteUser = (userId: number) => setDeleteUserModal({ isOpen: true, userId });

    const handleCloseUserFormModal = () => setUserFormModal({ isOpen: false, mode: "create" });

    const handleCloseDeleteUserModal = () => setDeleteUserModal({ isOpen: false });

    const handleSubmitUserForm = (userData: any) => {
        if (userFormModal.mode === "create") {
            toast.success("Thêm người dùng thành công", `Đã thêm người dùng ${userData.fullName} vào hệ thống`);
        } else if (userFormModal.mode === "edit") {
            toast.success("Cập nhật người dùng thành công", `Thông tin người dùng ${userData.fullName} đã được cập nhật`);
        }
        handleCloseUserFormModal();
    };

    const handleConfirmDeleteUser = () => {
        const user = currentUnitUsers.find((u) => u.id === deleteUserModal.userId);
        if (user) {
            toast.success("Xóa người dùng thành công", `Đã xóa người dùng ${user.fullName} khỏi hệ thống`);
        }
        handleCloseDeleteUserModal();
    };

    // --- Unit modal handlers ---
    const handleOpenAddUnitModal = () => setUnitFormModal({ isOpen: true, mode: "create" });

    const handleOpenEditUnitModal = (unitId: number) => {
        const node = findNodeByCode(treeData, selectedUnitId || "UBND_HP");
        if (node?.children) {
            const child = node.children.find((c) => {
                const parsedId = parseInt(c.id);
                if (!isNaN(parsedId)) return parsedId === unitId;
                return c.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) === unitId;
            });
            if (child) setUnitFormModal({ isOpen: true, mode: "edit", unitId: child.id });
        }
    };

    const handleOpenDeleteUnitModal = (unitId: number) => {
        const node = findNodeByCode(treeData, selectedUnitId || "UBND_HP");
        if (node?.children) {
            const child = node.children.find((c) => {
                const parsedId = parseInt(c.id);
                if (!isNaN(parsedId)) return parsedId === unitId;
                return c.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) === unitId;
            });
            if (child) setDeleteUnitModal({ isOpen: true, unitId: child.id });
        }
    };

    const handleCloseUnitFormModal = () => setUnitFormModal({ isOpen: false, mode: "create" });
    const handleCloseDeleteUnitModal = () => setDeleteUnitModal({ isOpen: false });

    const handleSubmitUnitForm = (unitData: any) => {
        if (unitFormModal.mode === "create") {
            const newId = `${selectedUnitId}-${Date.now()}`;
            const parentNode = findNodeById(treeData, selectedUnitId || "root");
            const parentLevel = parentNode?.level ?? 0;
            const newNode: TreeNode = { id: newId, name: unitData.name, code: unitData.code, level: parentLevel + 1 };
            setTreeData(addNodeToTree(treeData, selectedUnitId || "root", newNode));
            toast.success("Thêm đơn vị thành công", `Đã thêm đơn vị "${unitData.name}" vào hệ thống`);
        } else if (unitFormModal.mode === "edit" && unitFormModal.unitId) {
            setTreeData(updateNodeInTree(treeData, unitFormModal.unitId, { name: unitData.name, code: unitData.code }));
            toast.success("Cập nhật đơn vị thành công", `Thông tin đơn vị "${unitData.name}" đã được cập nhật`);
        }
        handleCloseUnitFormModal();
    };

    const handleConfirmDeleteUnit = () => {
        if (!deleteUnitModal.unitId) return;
        const unitToDelete = findNodeById(treeData, deleteUnitModal.unitId);
        const unitName = unitToDelete?.name || "đơn vị";
        setTreeData(deleteNodeFromTree(treeData, deleteUnitModal.unitId));
        if (selectedUnitId === deleteUnitModal.unitId) {
            setSelectedUnitId(null);
            setIsPanelOpen(false);
            setSelectedTreeNode("root");
        }
        toast.success("Xóa đơn vị thành công", `Đã xóa đơn vị "${unitName}" khỏi hệ thống`);
        handleCloseDeleteUnitModal();
    };

    // --- Modal data derivations ---
    const userToDelete = deleteUserModal.userId
        ? currentUnitUsers.find((u) => u.id === deleteUserModal.userId)
        : undefined;

    const deleteUserData = userToDelete
        ? { username: userToDelete.username, fullName: userToDelete.fullName, email: userToDelete.email, department: currentUnitDetails?.name || "" }
        : undefined;

    const userForForm = userFormModal.userId ? currentUnitUsers.find((u) => u.id === userFormModal.userId) : undefined;
    const userFormData = userForForm
        ? {
              id: userForForm.id,
              username: userForForm.username,
              fullName: userForForm.fullName,
              email: userForForm.email,
              phone: userForForm.phone,
              position: userForForm.position,
              department: selectedUnitId || "",
              status: (userForForm.isActive ? "active" : "inactive") as "active" | "inactive",
          }
        : undefined;

    const unitForForm = unitFormModal.unitId ? findNodeById(treeData, unitFormModal.unitId) : undefined;
    const unitFormData = unitForForm
        ? { id: unitForForm.id, name: unitForForm.name, code: unitForForm.code, address: "", phone: "", email: "", foundedDate: "", status: "active" as "active" | "inactive", description: "" }
        : undefined;

    const unitToDelete = deleteUnitModal.unitId ? findNodeById(treeData, deleteUnitModal.unitId) : undefined;
    const deleteUnitData = unitToDelete ? { name: unitToDelete.name, code: unitToDelete.code } : undefined;

    // Locked unit info: truyền vào UserFormModal để khóa cứng field Đơn vị
    const lockedUnit = selectedUnitId && currentUnitDetails
        ? { value: selectedUnitId, label: currentUnitDetails.name }
        : undefined;

    return {
        // State
        searchQuery, setSearchQuery,
        filterStatus, setFilterStatus,
        selectedTreeNode,
        activeTab, setActiveTab,
        isPanelOpen,
        isLoadingDetail,
        treeData,
        // Derived
        totalItems, activeUnits, activeFiltersCount,
        selectedNode,
        currentUnitDetails,
        currentChildUnits,
        currentUnitUsers,
        childUnitTypeLabel,
        detailTabs,
        // Modal state
        userFormModal, deleteUserModal, unitFormModal, deleteUnitModal,
        userFormData, deleteUserData, unitFormData, deleteUnitData,
        lockedUnit,
        // Handlers
        handleTreeNodeClick, handleTreeNodeToggle,
        handleClosePanel,
        handleAddUser, handleViewUser, handleEditUser, handleDeleteUser,
        handleCloseUserFormModal, handleCloseDeleteUserModal,
        handleSubmitUserForm, handleConfirmDeleteUser,
        handleOpenAddUnitModal, handleOpenEditUnitModal, handleOpenDeleteUnitModal,
        handleCloseUnitFormModal, handleCloseDeleteUnitModal,
        handleSubmitUnitForm, handleConfirmDeleteUnit,
        // Tree helpers (needed for rendering)
        findNodeById,
    };
}
