import { api } from '@/lib/api/axios';
import { ApiResponse, PageResponse } from '@/lib/api/types';

export interface DepartmentResponse {
    id: string;
    deptName: string;
    code: string;
    establishedDate: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'MERGED' | 'CLOSED';
    phoneNumber: string | null;
    email: string | null;
    headquartersAddress: string | null;
    description: string | null;
    director: string | null;
    totalMembers: number;
    totalChildUnits: number;
    parentDepartmentId: string | null;
    children: DepartmentResponse[];
}

export interface DepartmentTreeResponse {
    id: string;
    deptName: string;
    code: string;
    parentDepartmentId: string | null;
    children: DepartmentTreeResponse[];
}

export interface DepartmentChildResponse {
    id: string;
    deptName: string;
    code: string;
    headquartersAddress: string;
    phoneNumber: string;
    totalMembers: number;
    status: string;
}

export interface DepartmentStatsResponse {
    totalUnits: number;
    activeUnits: number;
}

export interface DepartmentUpsertRequest {
    deptName: string;
    code: string;
    status: 'ACTIVE' | 'INACTIVE' | 'MERGED' | 'CLOSED';
    establishedDate?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    headquartersAddress?: string | null;
    description?: string | null;
    parentDepartmentId?: string | null;
}

export const departmentApi = {
    // Lấy toàn bộ cây đơn vị
    getTree: (): Promise<ApiResponse<DepartmentTreeResponse[]>> => 
        api.get('/departments/tree'),
    
    // Thống kê
    getStats: (): Promise<ApiResponse<DepartmentStatsResponse>> => 
        api.get('/departments/stats'),

    // Chi tiết 1 đơn vị
    getById: (id: string): Promise<ApiResponse<DepartmentResponse>> => 
        api.get(`/departments/${id}`),

    // Lấy danh sách con (phân trang)
    getChildrenPage: (id: string, params?: { keyword?: string; page?: number; size?: number }): Promise<ApiResponse<PageResponse<DepartmentChildResponse>>> =>
        api.get(`/departments/${id}/children`, { params }),

    // Tạo đơn vị
    create: (data: DepartmentUpsertRequest): Promise<ApiResponse<DepartmentResponse>> => 
        api.post('/departments', data),

    // Cập nhật đơn vị
    update: (id: string, data: DepartmentUpsertRequest): Promise<ApiResponse<DepartmentResponse>> => 
        api.put(`/departments/${id}`, data),

    // Xóa đơn vị
    delete: (id: string): Promise<ApiResponse<void>> => 
        api.delete(`/departments/${id}`)
};



