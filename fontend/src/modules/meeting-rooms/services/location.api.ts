import { api } from '@/lib/api/axios';
import { PageResponse, ApiResponse } from '@/lib/api/types';
import { MeetingRoom } from '../table/meetingRoomTable.schema';
import { MeetingRoomFormData } from '../form/meetingRoomForm.validation';

export const locationApi = {
  getLocations: (params: any): Promise<ApiResponse<PageResponse<MeetingRoom>>> => {
    return api.get('/locations', { params });
  },

  getLocationStats: (params?: { departmentId?: string }): Promise<ApiResponse<{ totalLocations: number, activeLocations: number, totalCapacity: number }>> => {
    return api.get('/locations/stats', { params });
  },

  getLocationById: (id: string): Promise<ApiResponse<MeetingRoom>> => {
    return api.get(`/locations/${id}`);
  },

  createLocation: (data: MeetingRoomFormData): Promise<ApiResponse<MeetingRoom>> => {
    return api.post('/locations', data);
  },

  updateLocation: (id: string, data: MeetingRoomFormData): Promise<ApiResponse<MeetingRoom>> => {
    return api.put(`/locations/${id}`, data);
  },

  deleteLocation: (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/locations/${id}`);
  }
};
