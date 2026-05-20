import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api/axios';
import { ApiResponse, PageResponse } from '@/lib/api/types';

interface PaginationResult<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

interface UsePaginationQueryOptions<T> {
  // Ưu tiên dùng fetchFunction chuẩn để tập trung code API
  fetchFunction?: (params: any) => Promise<ApiResponse<PageResponse<T>>>;
  // Endpoint URL fallback (nếu truyền chuỗi url)
  endpoint?: string; 
  
  initialPage?: number;
  initialSize?: number;
  initialSearch?: string;
  initialFilters?: Record<string, any>;
  onSuccess?: (data: PaginationResult<T>) => void;
  onError?: (error: Error) => void;
  
  // Dùng dữ liệu mock nếu API chưa có sẵn
  mockMode?: boolean; 
  mockData?: T[];
}

/**
 * Hook chuẩn hóa việc gọi API danh sách có phân trang, tìm kiếm và lọc.
 * Dễ dàng tái sử dụng ở mọi trang.
 */
export function usePaginationQuery<T>({
  fetchFunction,
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

  // Dùng ref để giữ reference ổn định cho các cấu hình (ngăn infinite render loop)
  const optionsRef = useRef({ fetchFunction, endpoint, mockMode, mockData, onSuccess, onError });
  useEffect(() => {
    optionsRef.current = { fetchFunction, endpoint, mockMode, mockData, onSuccess, onError };
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      fetchFunction: currentFetchFunction,
      endpoint: currentEndpoint,
      mockMode: currentMockMode,
      mockData: currentMockData,
      onSuccess: currentOnSuccess,
      onError: currentOnError
    } = optionsRef.current;

    try {
      if (currentMockMode) {
        // Mock data flow
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        let filtered = [...currentMockData];
        if (search) {
          filtered = filtered.filter(item => 
            JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
          );
        }
        
        const pageData = filtered.slice((page - 1) * size, page * size);
        setTotalItems(filtered.length);
        setData(pageData);
        
        if (currentOnSuccess) {
          currentOnSuccess({
            data: pageData,
            totalElements: filtered.length,
            totalPages: Math.ceil(filtered.length / size),
            currentPage: page
          });
        }
      } else {
        // Real API Call via fetchFunction (Best Practice) or endpoint string.
        const requestParams = {
          page: page - 1, // backend 0-indexed assumed. Nếu là 1-indexed đổi thành page
          size,
          search,
          ...filters,
        };

        let response: ApiResponse<PageResponse<T>>;
        
        if (currentFetchFunction) {
          response = await currentFetchFunction(requestParams);
        } else if (currentEndpoint) {
          response = await api.get(currentEndpoint, { params: requestParams });
        } else {
          throw new Error('Must provide either fetchFunction or endpoint.');
        }
        
        // Theo chuẩn ApiResponse<PageResponse<T>>
        const pageResponse = response.data; 
        
        if (response.success && pageResponse) {
           setData(pageResponse.content || []);
           setTotalItems(pageResponse.totalElements || 0);
           
           if (currentOnSuccess) {
             currentOnSuccess({
               data: pageResponse.content || [],
               totalElements: pageResponse.totalElements || 0,
               totalPages: pageResponse.totalPages || 0,
               currentPage: page
             });
           }
        } else {
          throw new Error(response.message || 'API error');
        }
      }
    } catch (err: any) {
      setError(err);
      if (currentOnError) currentOnError(err);
    } finally {
      setLoading(false);
    }
  }, [page, size, search, filters]);

  // Tự động gọi API khi dependencies thay đổi
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage: number) => setPage(newPage);

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
    setPage(1); // reset về trang 1
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const refresh = () => fetchData();

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
