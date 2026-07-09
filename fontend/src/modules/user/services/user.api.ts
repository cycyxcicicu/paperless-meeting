import { api } from '@/lib/api/axios';
import { PageResponse, ApiResponse } from '@/lib/api/types';
import { User, UserFormData } from '@/modules/user/table/userTable.schema';

export interface UserStatsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

export const userApi = {
  // Lấy danh sách người dùng có phân trang và bộ lọc
  getUsers: (params: any): Promise<ApiResponse<PageResponse<User>>> => {
    return api.get('/users', { params });
  },

  // Lấy thống kê người dùng
  getStats: (): Promise<ApiResponse<UserStatsResponse>> => {
    return api.get('/users/stats');
  },

  // Lấy chi tiết user (nếu cần)
  getUserById: (id: number | string): Promise<ApiResponse<User>> => {
    return api.get(`/users/${id}`);
  },

  // Thêm mới người dùng
  createUser: (data: UserFormData): Promise<ApiResponse<User>> => {
    return api.post('/users/register', data);
  },

  // Cập nhật người dùng
  updateUser: (id: number | string, data: UserFormData): Promise<ApiResponse<User>> => {
    return api.put(`/users/${id}`, data);
  },

  // Xóa người dùng
  deleteUser: (id: number | string): Promise<ApiResponse<void>> => {
    return api.delete(`/users/${id}`);
  },

  // Upload ảnh đại diện
  uploadAvatar: (file: File): Promise<ApiResponse<{ fileUrl: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/avatar/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};
