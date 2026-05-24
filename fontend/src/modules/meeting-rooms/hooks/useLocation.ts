import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/error';
import { locationApi } from '../services/location.api';
import { MeetingRoom } from '../table/meetingRoomTable.schema';
import { MeetingRoomFormData } from '../form/meetingRoomForm.validation';

export const useLocation = () => {
  const [locations, setLocations] = useState<MeetingRoom[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState({ totalLocations: 0, activeLocations: 0, totalCapacity: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const res = await locationApi.getLocationStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch location stats:', error);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await locationApi.getLocations({
        page: currentPage - 1,
        size: pageSize,
        keyword: searchQuery,
      });

      if (res.data) {
        setLocations(res.data.content);
        setTotalItems(res.data.totalElements);
      }
      
      // Fetch stats to sync with updates
      await fetchStats();
    } catch (error) {
      toast.error('Lỗi', getErrorMessage(error) || 'Không thể tải danh sách địa điểm họp');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, fetchStats]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const createLocation = async (data: MeetingRoomFormData) => {
    try {
      await locationApi.createLocation(data);
      toast.success('Thành công', 'Thêm mới địa điểm họp thành công');
      fetchLocations();
      return true;
    } catch (error) {
      toast.error('Lỗi', getErrorMessage(error) || 'Thêm mới địa điểm họp thất bại');
      throw error;
    }
  };

  const updateLocation = async (id: string, data: MeetingRoomFormData) => {
    try {
      await locationApi.updateLocation(id, data);
      toast.success('Thành công', 'Cập nhật địa điểm họp thành công');
      fetchLocations();
      return true;
    } catch (error) {
      toast.error('Lỗi', getErrorMessage(error) || 'Cập nhật địa điểm họp thất bại');
      throw error;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      await locationApi.deleteLocation(id);
      toast.success('Thành công', 'Xóa địa điểm họp thành công');
      fetchLocations();
      return true;
    } catch (error) {
      toast.error('Lỗi', getErrorMessage(error) || 'Xóa địa điểm họp thất bại');
      return false;
    }
  };

  return {
    locations,
    totalItems,
    stats,
    loading,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  };
};
