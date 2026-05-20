import { api } from '@/lib/api/axios';
import { PageResponse, ApiResponse } from '@/lib/api/types';
import { User, UserFormData } from '@/modules/user/table/userTable.schema';

export const userApi = {
  // Lấy danh sách người dùng có phân trang và bộ lọc
  getUsers: (params: any): Promise<ApiResponse<PageResponse<User>>> => {
    return api.get('/users', { params });
  },

  // Lấy chi tiết user (nếu cần)
  getUserById: (id: number): Promise<ApiResponse<User>> => {
    return api.get(`/users/${id}`);
  },

  // Thêm mới người dùng
  createUser: (data: UserFormData): Promise<ApiResponse<User>> => {
    return api.post('/users', data);
  },

  // Cập nhật người dùng
  updateUser: (id: number, data: UserFormData): Promise<ApiResponse<User>> => {
    return api.put(`/users/${id}`, data);
  },

  // Xóa người dùng
  deleteUser: (id: number): Promise<ApiResponse<void>> => {
    return api.delete(`/users/${id}`);
  }
};
