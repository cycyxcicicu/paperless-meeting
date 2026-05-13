import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/axios';

interface PaginationParams {
  page: number;
  size: number;
  search?: string;
  filters?: Record<string, any>;
}

interface PaginationResult<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

interface UsePaginationQueryOptions<T> {
  endpoint: string;
  initialPage?: number;
  initialSize?: number;
  initialSearch?: string;
  initialFilters?: Record<string, any>;
  onSuccess?: (data: PaginationResult<T>) => void;
  onError?: (error: Error) => void;
  // Set to true if you are using mock data and don't want to actually hit the API yet
  mockMode?: boolean; 
  mockData?: T[];
}

/**
 * Hook chuẩn hóa việc gọi API danh sách có phân trang, tìm kiếm và lọc.
 */
export function usePaginationQuery<T>({
  endpoint,
  initialPage = 1,
  initialSize = 10,
  initialSearch = '',
  initialFilters = {},
  onSuccess,
  onError,
  mockMode = false,
  mockData = [],
}: UsePaginationQueryOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (mockMode) {
        // Simulate API call for mock mode
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        let filtered = [...mockData];
        if (search) {
          // simple search
          filtered = filtered.filter(item => 
            JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
          );
        }
        
        setTotalItems(filtered.length);
        setData(filtered.slice((page - 1) * size, page * size));
        
        if (onSuccess) {
          onSuccess({
            data: filtered.slice((page - 1) * size, page * size),
            totalElements: filtered.length,
            totalPages: Math.ceil(filtered.length / size),
            currentPage: page
          });
        }
      } else {
        // Real API call
        const response = await api.get<any, PaginationResult<T>>(endpoint, {
          params: {
            page: page - 1, // backend is usually 0-indexed
            size,
            search,
            ...filters,
          },
        });
        
        setData(response.data);
        setTotalItems(response.totalElements);
        if (onSuccess) onSuccess(response);
      }
    } catch (err: any) {
      setError(err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, size, search, filters, mockMode, mockData, onSuccess, onError]);

  // Fetch data automatically when params change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
    setPage(1); // reset to page 1 when size changes
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const refresh = () => {
    fetchData();
  };

  return {
    data,
    totalItems,
    totalPages: Math.ceil(totalItems / size),
    loading,
    error,
    page,
    size,
    search,
    filters,
    handlePageChange,
    handleSizeChange,
    handleSearch,
    handleFilterChange,
    refresh,
  };
}
