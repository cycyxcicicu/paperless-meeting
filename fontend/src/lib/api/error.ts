import { AxiosError } from 'axios';
import { ApiResponse } from './types';

/**
 * Trích xuất an toàn thông báo lỗi từ các phản hồi API của Backend
 * Dùng hàm này ở bất kỳ đâu gọi API để lấy thông báo chuẩn xác nhất!
 */
export const getErrorMessage = (error: unknown, fallbackMessage: string = 'Đã có lỗi xảy ra'): string => {
  // Lấy message từ Axios Error (khi Backend trả về lỗi 400, 403, 500...)
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiResponse>;
    const responseData = axiosError.response?.data;

    if (responseData) {
      // 1. Kiểm tra lỗi validate chi tiết từ backend (AppValidationException)
      // data sẽ chứa map như { roleCode: "Mã vai trò đã tồn tại" }
      const errorDetails = responseData.data;
      if (errorDetails && typeof errorDetails === 'object' && !Array.isArray(errorDetails)) {
        const messages = Object.values(errorDetails).filter((msg): msg is string => typeof msg === 'string');
        if (messages.length > 1) {
          return 'Dữ liệu chưa hợp lệ:\n' + messages.map(msg => `- ${msg}`).join('\n');
        } else if (messages.length === 1) {
          return messages[0];
        }
      }

      // 2. Kiểm tra thông báo lỗi chung của hệ thống (AppException)
      if (responseData.message) {
        return responseData.message;
      }
    }
  }

  // Dự phòng nếu lỗi là đối tượng Error thuần túy tĩnh
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};
