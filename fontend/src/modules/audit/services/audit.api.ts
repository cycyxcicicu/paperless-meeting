import { api } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/api/types';
import { PageResponse } from '@/modules/meeting/services/meeting.api';
import { AuditLog } from '../table/auditTable.schema';

export interface AuditLogStatsResponse {
  totalLogs: number;
  todayLogs: number;
  criticalActions: number;
  activeUsers: number;
}

export const auditApi = {
  getAuditLogs: (params: {
    page?: number;
    size?: number;
    keyword?: string;
    sort?: string;
  }): Promise<ApiResponse<PageResponse<AuditLog>>> => {
    return api.get('/audit-logs', { params });
  },

  getAuditStats: (): Promise<ApiResponse<AuditLogStatsResponse>> => {
    return api.get('/audit-logs/stats');
  },
};
