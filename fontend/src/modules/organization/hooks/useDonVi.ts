import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { Info, Building2, Users } from "lucide-react";
import { departmentApi, DepartmentResponse, DepartmentTreeResponse, DepartmentUpsertRequest } from "../services/department.api";
import { userApi } from "@/modules/user/services/user.api";
import { TreeNode } from "../types";
import { useAuth } from "@/app/context/AuthContext";

export type TabKey = "info" | "child-units" | "users";

export function useDonVi() {
    const { user } = useAuth();
    const roleCode = user?.role?.roleCode || "USER";

    const canEditUnit = roleCode === "SUPER_ADMIN" || roleCode === "DEPARTMENT_ADMIN";
    const canDeleteUnit = roleCode === "SUPER_ADMIN" || roleCode === "DEPARTMENT_ADMIN";
    const canAddUnit = roleCode === "SUPER_ADMIN" || roleCode === "DEPARTMENT_ADMIN";

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

    // Server state
    const [rawTree, setRawTree] = useState<DepartmentTreeResponse[]>([]);
    const [detailedUnit, setDetailedUnit] = useState<DepartmentResponse | null>(null);
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [stats, setStats] = useState({ totalUnits: 0, activeUnits: 0 });
    const [currentUnitUsers, setCurrentUnitUsers] = useState<any[]>([]);
    const [userPage, setUserPage] = useState(1);
    const [userPageSize, setUserPageSize] = useState(5);
    const [userSearch, setUserSearch] = useState("");
    const [userTotal, setUserTotal] = useState(0);

    const [currentChildUnits, setCurrentChildUnits] = useState<any[]>([]);

    const loadStats = async () => {
        try {
            const res = await departmentApi.getStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadUnitDetails = async (unitId: string) => {
        setIsLoadingDetail(true);
        try {
            const res = await departmentApi.getById(unitId);
            if (res.success && res.data) {
                setDetailedUnit(res.data);
            }
        } catch (e) {
            toast.error("Lỗi", "Không thể tải chi tiết định danh đơn vị");
        }
        setIsLoadingDetail(false);
    };

    const loadTree = async () => {
        try {
            const res = await departmentApi.getTree();
            if (res.success && res.data) {
                setRawTree(res.data);
                
                const mapNode = (d: DepartmentTreeResponse, level: number): TreeNode => ({
                    id: d.id,
                    name: d.deptName,
                    code: d.code,
                    level: level,
                    isExpanded: level < 2,
                    children: d.children ? d.children.map(child => mapNode(child, level + 1)) : []
                });
                
                const uiTree = res.data.map(d => mapNode(d, 0));
                setTreeData(uiTree);

                if (uiTree.length > 0 && !selectedUnitId) {
                    const rootNode = uiTree[0];
                    setSelectedTreeNode(rootNode.id);
                    setSelectedUnitId(rootNode.id);
                    setIsPanelOpen(true);
                    setActiveTab("info");
                }
            }
        } catch (e) {
            toast.error("Lỗi", "Không thể tải cấu trúc đơn vị");
        }
    };

    useEffect(() => {
        loadTree();
        loadStats();
    }, []);

    const loadUnitUsers = async (deptId: string, page = 1, size = 5, keyword = "") => {
        try {
            const res = await userApi.getUsers({ 
                departmentId: deptId,
                page: page - 1,
                size: size,
                keyword: keyword
            });
            if (res.success && res.data) {
                setCurrentUnitUsers(res.data.content);
                setUserTotal(res.data.totalElements);
            }
        } catch (e) {
            toast.error("Lỗi", "Không thể tải danh sách nhân sự");
        }
    };

    const loadUnitChildren = async (deptId: string) => {
        try {
            const res = await departmentApi.getChildrenPage(deptId);
            if (res.success && res.data) {
                const mapped = res.data.content.map(child => ({
                    id: child.id,
                    name: child.deptName,
                    code: child.code,
                    address: child.headquartersAddress || "",
                    phone: child.phoneNumber || "",
                    totalMembers: child.totalMembers,
                    isActive: child.status === 'ACTIVE',
                }));
                setCurrentChildUnits(mapped);
            }
        } catch (e) {
            toast.error("Lỗi", "Không thể tải cấu trúc bộ phận trực thuộc");
        }
    };

    useEffect(() => {
        if (selectedUnitId) {
            setUserPage(1);
            setUserSearch("");
            loadUnitDetails(selectedUnitId);
            loadUnitChildren(selectedUnitId);
        }
    }, [selectedUnitId]);

    // Separate effect for loaded users tracking pagination & search
    useEffect(() => {
        if (selectedUnitId) {
            const timeoutId = setTimeout(() => {
                loadUnitUsers(selectedUnitId, userPage, userPageSize, userSearch);
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [selectedUnitId, userPage, userPageSize, userSearch]);

    const activeFiltersCount = (searchQuery ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

    // --- Helper Maps ---
    const getUnitMap = (nodes: DepartmentTreeResponse[]): Record<string, DepartmentTreeResponse> => {
        const map: Record<string, DepartmentTreeResponse> = {};
        const recurse = (node: DepartmentTreeResponse) => {
            map[node.id] = node;
            if (node.children) node.children.forEach(recurse);
        };
        nodes.forEach(recurse);
        return map;
    };
    const unitMap = getUnitMap(rawTree);

    const currentUnitDetails = detailedUnit ? {
        id: detailedUnit.id,
        name: detailedUnit.deptName,
        code: detailedUnit.code,
        address: detailedUnit.headquartersAddress || "",
        phone: detailedUnit.phoneNumber || "",
        email: detailedUnit.email || "",
        establishedDate: detailedUnit.establishedDate || "",
        director: detailedUnit.director || "",
        description: detailedUnit.description || "",
        isActive: detailedUnit.status === 'ACTIVE',
        totalMembers: detailedUnit.totalMembers,
        totalChildUnits: detailedUnit.totalChildUnits,
        parentId: detailedUnit.parentDepartmentId,
        parentName: detailedUnit.parentDepartmentId ? unitMap[detailedUnit.parentDepartmentId]?.deptName : ""
    } : null;

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

    // --- Tree handlers ---
    const handleTreeNodeToggle = (nodeId: string) => setTreeData(toggleTreeNode(nodeId, treeData));

    const handleViewDetails = (unitId: string) => {
        setSelectedUnitId(unitId);
        setIsPanelOpen(true);
        setActiveTab("info");
    };

    const handleTreeNodeClick = (nodeId: string) => {
        setSelectedTreeNode(nodeId);
        handleViewDetails(nodeId);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setTimeout(() => setSelectedUnitId(null), 300);
    };

    const selectedNode = findNodeById(treeData, selectedTreeNode);
    const actualLevel = selectedNode?.level || 0;
    
    // Nếu là DEPARTMENT_ADMIN, gốc cây thư mục (level 0) của họ thực chất là cấp Sở.
    // Việc cộng thêm 1 giúp đồng bộ thuật ngữ hiển thị cho cả 2 vai trò.
    const conceptualLevel = roleCode === "DEPARTMENT_ADMIN" ? actualLevel + 1 : actualLevel;

    let infoLabel = "Thông tin đơn vị";
    let childrenLabel = "Đơn vị trực thuộc";
    let childUnitTypeLabel = "đơn vị trực thuộc";
    if (conceptualLevel === 1) {
        infoLabel = "Thông tin sở";
        childrenLabel = "Phòng ban trực thuộc";
        childUnitTypeLabel = "phòng ban trực thuộc";
    } else if (conceptualLevel === 2) {
        infoLabel = "Thông tin phòng ban";
        childrenLabel = "Bộ phận trực thuộc";
        childUnitTypeLabel = "bộ phận trực thuộc";
    } else if (conceptualLevel >= 3) {
        infoLabel = "Thông tin bộ phận";
    }

    const detailTabs: any[] = [
        { key: "info" as TabKey, label: infoLabel, icon: Info },
    ];
    
    if (conceptualLevel < 3) {
        detailTabs.push({ key: "child-units" as TabKey, label: childrenLabel, icon: Building2, count: currentUnitDetails?.totalChildUnits || currentChildUnits.length });
    }
    
    detailTabs.push({ key: "users" as TabKey, label: "Danh sách nhân sự", icon: Users, count: currentUnitDetails?.totalMembers || userTotal });

    // Fallback if the user was on the child-units tab and clicks a deep unit where it's hidden
    useEffect(() => {
        if (conceptualLevel >= 3 && activeTab === "child-units") {
            setActiveTab("info");
        }
    }, [conceptualLevel, activeTab]);

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

    const handleSubmitUserForm = async (userData: any) => {
        try {
            if (userFormModal.mode === "create") {
                const response = await userApi.createUser(userData);
                if (response.success) {
                    toast.success("Thành công", "Thêm nhân sự thành công");
                } else {
                    throw new Error(response.message || "Không thể khởi tạo nhân sự");
                }
            } else if (userFormModal.mode === "edit") {
                if (!userData.id) {
                    throw new Error("Không tìm thấy mã số id nhân viên cần chỉnh sửa");
                }
                const response = await userApi.updateUser(userData.id, userData);
                if (response.success) {
                    toast.success("Thành công", "Cập nhật nhân sự thành công");
                } else {
                    throw new Error(response.message || "Không thể cập nhật nhân sự");
                }
            }
            handleCloseUserFormModal();
            if (selectedUnitId) {
                loadUnitUsers(selectedUnitId, userPage, userPageSize, userSearch);
                loadUnitDetails(selectedUnitId);
            }
        } catch (error: any) {
            toast.error("Lỗi thao tác", error.message || "Có lỗi xảy ra trong quá trình lưu dữ liệu");
            throw error;
        }
    };

    const handleConfirmDeleteUser = async () => {
        try {
            if (deleteUserModal.userId) {
                await userApi.deleteUser(deleteUserModal.userId);
                toast.success("Thành công", "Đã xóa nhân sự");
                if (selectedUnitId) {
                    loadUnitUsers(selectedUnitId, userPage, userPageSize, userSearch);
                    loadUnitDetails(selectedUnitId);
                }
            }
        } catch (e) {
            toast.error("Lỗi", "Không thể xóa nhân sự");
        }
        handleCloseDeleteUserModal();
    };

    // --- Unit modal handlers ---
    const handleOpenAddUnitModal = () => setUnitFormModal({ isOpen: true, mode: "create" });
    const handleOpenEditUnitModal = (unitId: string) => setUnitFormModal({ isOpen: true, mode: "edit", unitId });
    const handleOpenDeleteUnitModal = (unitId: string) => setDeleteUnitModal({ isOpen: true, unitId });
    const handleCloseUnitFormModal = () => setUnitFormModal({ isOpen: false, mode: "create" });
    const handleCloseDeleteUnitModal = () => setDeleteUnitModal({ isOpen: false });

    const handleSubmitUnitForm = async (unitData: any) => {
        try {
            const req: DepartmentUpsertRequest = {
                deptName: unitData.name,
                code: unitData.code,
                status: unitData.status === 'active' ? 'ACTIVE' : 'INACTIVE',
                establishedDate: unitData.establishedDate,
                phoneNumber: unitData.phone,
                email: unitData.email,
                headquartersAddress: unitData.address,
                description: unitData.description,
                parentDepartmentId: selectedUnitId || null,
            };

            if (unitFormModal.mode === "create") {
                await departmentApi.create(req);
                toast.success("Thành công", "Đã thêm đơn vị");
            } else if (unitFormModal.mode === "edit" && unitFormModal.unitId) {
                await departmentApi.update(unitFormModal.unitId, req);
                toast.success("Thành công", "Đã cập nhật đơn vị");
            }
            loadTree();
            loadStats();
            if (selectedUnitId) {
                loadUnitDetails(selectedUnitId);
                loadUnitChildren(selectedUnitId);
            }
            handleCloseUnitFormModal();
        } catch (e: any) {
            toast.error("Lỗi", e.message || "Có lỗi xảy ra");
            throw e;
        }
    };

    const handleConfirmDeleteUnit = async () => {
        if (!deleteUnitModal.unitId) return;
        try {
            await departmentApi.delete(deleteUnitModal.unitId);
            toast.success("Thành công", "Đã xóa đơn vị");
            
            if (selectedUnitId === deleteUnitModal.unitId) {
                setSelectedUnitId(null);
                setIsPanelOpen(false);
                setSelectedTreeNode("root");
            } else if (selectedUnitId) {
                loadUnitDetails(selectedUnitId);
                loadUnitChildren(selectedUnitId);
            }
            loadTree();
            loadStats();
        } catch (e) {
            toast.error("Lỗi", "Không thể xóa đơn vị");
        }
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

    const getDetailedUnitForForm = (id: string | undefined) => {
        if (!id || !detailedUnit) return undefined;
        if (detailedUnit.id === id) return detailedUnit;
        const child = detailedUnit.children?.find(c => c.id === id);
        if (child) return child;
        return undefined;
    };
    
    const unitForForm = getDetailedUnitForForm(unitFormModal.unitId);
    const unitFormData = unitForForm
        ? { id: unitForForm.id, name: unitForForm.deptName, code: unitForForm.code, address: unitForForm.headquartersAddress || "", phone: unitForForm.phoneNumber || "", email: unitForForm.email || "", foundedDate: unitForForm.establishedDate || "", status: (unitForForm.status === 'ACTIVE' ? "active" : "inactive") as "active" | "inactive", description: unitForForm.description || "" }
        : undefined;

    const unitToDelete = deleteUnitModal.unitId ? unitMap[deleteUnitModal.unitId] : undefined;
    const deleteUnitData = unitToDelete ? { name: unitToDelete.deptName, code: unitToDelete.code } : undefined;

    const lockedUnit = selectedUnitId && currentUnitDetails
        ? { value: selectedUnitId, label: currentUnitDetails.name }
        : undefined;

    // --- Dynamic User Permissions ---
    // Cả SUPER_ADMIN và DEPARTMENT_ADMIN đều được phép sửa/xóa nhân sự
    const canEditUser = roleCode === "SUPER_ADMIN" || roleCode === "DEPARTMENT_ADMIN";
    const canDeleteUser = roleCode === "SUPER_ADMIN" || roleCode === "DEPARTMENT_ADMIN";

    // Quyền thêm mới nhân dụng chỉ hiện hữu khi admin đang chọn xem đúng cấp Đơn Vị cha (Sở / UBND)
    // Ẩn hoàn toàn khi đứng ở các phòng bộ con để tránh dữ liệu phân bổ sai lệch cấu trúc phẳng
    const isTopLevelUnit = currentUnitDetails && (
        !currentUnitDetails.parentId || 
        currentUnitDetails.parentName === "UBND thành phố Hải Phòng"
    );
    const canAddUser = (roleCode === "SUPER_ADMIN" && !!isTopLevelUnit) || (roleCode === "DEPARTMENT_ADMIN");

    return {
        // Permissions
        canEditUser, canDeleteUser, canAddUser, canEditUnit, canDeleteUnit, canAddUnit,
        // State
        searchQuery, setSearchQuery,
        filterStatus, setFilterStatus,
        selectedTreeNode,
        activeTab, setActiveTab,
        isPanelOpen,
        isLoadingDetail,
        treeData,
        // Derived
        totalItems: stats.totalUnits,
        activeUnits: stats.activeUnits,
        activeFiltersCount,
        selectedNode,
        currentUnitDetails,
        currentChildUnits,
        currentUnitUsers,
        userTotal, userPage, setUserPage, userPageSize, setUserPageSize, userSearch, setUserSearch,
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
        findNodeById,
    };
}
