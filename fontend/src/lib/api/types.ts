export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string | null;
  data: T;
}

export interface PageResponse<T = any> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
