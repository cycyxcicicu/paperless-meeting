import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../error';
import { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

describe('getErrorMessage utility test', () => {
  it('should extract error details from AppValidationException with multiple validation messages', () => {
    const errorResponse: AxiosResponse<ApiResponse> = {
      data: {
        success: false,
        message: 'Validation failed',
        data: {
          positionId: 'Đơn vị đã đạt số lượng tối đa Phó Trưởng phòng',
          departmentId: 'Phòng ban không tồn tại'
        }
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} as any }
    };

    const mockError = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      errorResponse
    );

    const message = getErrorMessage(mockError);
    expect(message).toContain('Dữ liệu chưa hợp lệ:');
    expect(message).toContain('- Đơn vị đã đạt số lượng tối đa Phó Trưởng phòng');
    expect(message).toContain('- Phòng ban không tồn tại');
  });

  it('should extract single error message from AppValidationException', () => {
    const errorResponse: AxiosResponse<ApiResponse> = {
      data: {
        success: false,
        message: 'Validation failed',
        data: {
          positionId: 'Quá số lượng Phó Trưởng phòng theo quy định biên chế'
        }
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} as any }
    };

    const mockError = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      errorResponse
    );

    const message = getErrorMessage(mockError);
    expect(message).toBe('Quá số lượng Phó Trưởng phòng theo quy định biên chế');
  });

  it('should fallback to default message if no response data is present', () => {
    const mockError = new Error('Generic Network Error');
    const message = getErrorMessage(mockError, 'Fallback error message');
    expect(message).toBe('Generic Network Error');
  });

  it('should return default fallback message when error is unknown', () => {
    const message = getErrorMessage(null, 'Hệ thống bận, vui lòng thử lại sau');
    expect(message).toBe('Hệ thống bận, vui lòng thử lại sau');
  });
});
