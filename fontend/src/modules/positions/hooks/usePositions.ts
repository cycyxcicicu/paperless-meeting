import { useState, useCallback, useMemo } from 'react';
import { toast } from '@/lib/toast';
import { positionApi, PositionResponse, PositionUpsertRequest, PositionStatsResponse } from '../services/position.api';
import { Position } from '../table/positionTable.schema';
import { getErrorMessage } from '@/lib/api/error';

interface UsePositionsProps {
  initialSearch?: string;
}

export const usePositions = ({ initialSearch = '' }: UsePositionsProps = {}) => {
  const [data, setData] = useState<PositionResponse[]>([]);
  const [stats, setStats] = useState<PositionStatsResponse>({
    totalPositions: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Pagination states for client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPositions = useCallback(async (search: string = '', page: number = currentPage, size: number = pageSize) => {
    try {
      setIsLoading(true);
      // SpringBoot Web Pageable uses 0-based page index natively by default
      const res = await positionApi.getPositions(search.trim(), page - 1, size);
      if (res.success && res.data) {
        setData(res.data.content);
        setTotalItems(res.data.totalElements);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Lỗi khi tải danh sách chức vụ'));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const res = await positionApi.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Handlers for CRUD
  const handleCreate = async (payload: PositionUpsertRequest) => {
    try {
      const res = await positionApi.createPosition(payload);
      if (res.success && res.data) {
        toast.success(res.message || 'Thêm chức vụ thành công');
        await fetchPositions(searchQuery);
        await fetchStats();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Lỗi khi thêm chức vụ'));
      return false;
    }
  };

  const handleUpdate = async (id: string, payload: PositionUpsertRequest) => {
    try {
      const res = await positionApi.updatePosition(id, payload);
      if (res.success && res.data) {
        toast.success(res.message || 'Cập nhật chức vụ thành công');
        await fetchPositions(searchQuery);
        return true;
      }
      return false;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Lỗi khi cập nhật chức vụ'));
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await positionApi.deletePosition(id);
      if (res.success) {
        toast.success(res.message || 'Xóa chức vụ thành công');
        await fetchPositions(searchQuery);
        await fetchStats();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Lỗi khi xóa chức vụ'));
      return false;
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset page on new search
  };

  // Convert raw API dat to Table View model
  const mappedPositions: Position[] = useMemo(() => {
    return (data || []).map((item) => ({
      id: item.id,
      name: item.positionName,
      code: item.positionCode,
      description: item.description || '',
      memberCount: 0, // Mocked for now since backend doesn't provide user count per position in findAll
      status: 'active',
      rankOrder: item.rankOrder,
      isLeadership: item.isLeadership,
      createdAt: item.createdAt,
    }));
  }, [data]);

  // Client-side pagination logic (BỊ LOẠI BỎ THAY BẰNG SERVER-SIDE)
  return {
    positions: mappedPositions,
    stats,
    isLoading,
    isStatsLoading,
    searchQuery,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    setPageSize,
    setCurrentPage,
    handleSearch,
    fetchPositions,
    fetchStats,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
};
