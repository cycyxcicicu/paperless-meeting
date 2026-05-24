import { api } from '@/lib/api/axios';
import { ApiResponse, PageResponse } from '@/lib/api/types';

export interface PositionStatsResponse {
  totalPositions: number;
  totalUsers: number;
}

export interface PositionResponse {
  id: string;
  positionName: string;
  positionCode: string;
  rankOrder: number;
  isLeadership: boolean;
  description: string;
  departmentId?: string;
  departmentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PositionUpsertRequest {
  positionName: string;
  positionCode: string;
  rankOrder: number;
  isLeadership: boolean;
  description?: string;
}

export const positionApi = {
  // Lấy danh sách tất cả chức vụ (có kết hợp tìm kiếm và phân trang)
  getPositions: (search?: string, page?: number, size?: number): Promise<ApiResponse<PageResponse<PositionResponse>>> => {
    return api.get('/positions', { params: { search, page, size } });
  },

  // Lấy thông số thống kê chức vụ
  getStats: (): Promise<ApiResponse<PositionStatsResponse>> => {
    return api.get('/positions/stats');
  },

  // Lấy chi tiết chức vụ
  getPositionById: (id: string): Promise<ApiResponse<PositionResponse>> => {
    return api.get(`/positions/${id}`);
  },

  // Tạo mới chức vụ
  createPosition: (data: PositionUpsertRequest): Promise<ApiResponse<PositionResponse>> => {
    return api.post('/positions', data);
  },

  // Cập nhật chức vụ
  updatePosition: (id: string, data: PositionUpsertRequest): Promise<ApiResponse<PositionResponse>> => {
    return api.put(`/positions/${id}`, data);
  },

  // Xóa chức vụ
  deletePosition: (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/positions/${id}`);
  }
};
