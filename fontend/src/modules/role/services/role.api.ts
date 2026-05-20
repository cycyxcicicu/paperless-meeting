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
  getRoles: (): Promise<ApiResponse<Role[]>> => {
    return api.get('/roles');
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
