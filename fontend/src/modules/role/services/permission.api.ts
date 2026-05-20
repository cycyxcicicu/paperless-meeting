import { api } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/api/types';

export interface Permission {
  id: string;
  permCode: string;
  description: string;
}

export const permissionApi = {
  // Lấy danh sách tất cả quyền từ Backend
  getPermissions: (): Promise<ApiResponse<Permission[]>> => {
    return api.get('/permissions');
  },
};
