import { api } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/api/types';
import { Role } from '../table/roleTableColumns';

export interface RoleUpsertRequest {
  roleCode: string;
  roleName: string;
  permCodes?: string[];
}

export const roleApi = {
  // Lấy danh sách vai trò
  getRoles: (keyword?: string): Promise<ApiResponse<Role[]>> => {
    return api.get('/roles', { params: { keyword } });
  },

  // Lấy thống kê vai trò
  getRoleStats: (): Promise<ApiResponse<{ totalRoles: number, activeRoles: number, usersWithoutRole: number }>> => {
    return api.get('/roles/stats');
  },

  // Lấy chi tiết vai trò
  getRoleById: (id: string | number): Promise<ApiResponse<Role>> => {
    return api.get(`/roles/${id}`);
  },

  // Thêm mới vai trò (Sử dụng RoleUpsertRequest DTO)
  createRole: (data: RoleUpsertRequest): Promise<ApiResponse<Role>> => {
    return api.post('/roles', data);
  },

  // Cập nhật vai trò
  updateRole: (id: string | number, data: RoleUpsertRequest): Promise<ApiResponse<Role>> => {
    return api.put(`/roles/${id}`, data);
  },

  // Xóa vai trò
  deleteRole: (id: string | number): Promise<ApiResponse<void>> => {
    return api.delete(`/roles/${id}`);
  }
};
