import { api } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/api/types';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface MeetingResponse {
  id: string;
  title: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'UPCOMING' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';
  startTime: string;
  endTime: string;
  rsvpDeadline?: string;
  content?: string;
  onlineLink?: string;
  locationId?: string;
  locationName?: string;
  departmentId?: string;
  departmentName?: string;
  createdById?: string;
  createdByName?: string;
  callerRole?: string;
  callerInviteStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  chairName?: string;
  lateAfterMinutes?: number;
  
  participantsCount?: number;
  documentsCount?: number;
  canEdit?: boolean;
  canCancel?: boolean;
  canPublish?: boolean;
  canPostpone?: boolean;
  canDelete?: boolean;
  canSubmitApproval?: boolean;
  canUploadDocs?: boolean;
}

export interface AgendaDocumentResponse {
  documentId: string;
  title: string;
  usageType: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
}

export interface AgendaItemResponse {
  id: string;
  title: string;
  content?: string;
  orderNo?: number;
  durationEst?: number;
  status: 'DRAFT' | 'PENDING_PREPARATION' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';
  preparedByUserId?: string;
  preparedByFullName?: string;
  startTime?: string;
  endTime?: string;
  rejectReason?: string;
  prepDeadline?: string;
  meetingId: string;
  documents: AgendaDocumentResponse[];
}

export const meetingApi = {
  getMeetings: (params: {
    page?: number;
    size?: number;
    keyword?: string;
    statuses?: string[];
    fromDate?: string;
    toDate?: string;
  }): Promise<ApiResponse<PageResponse<MeetingResponse>>> => {
    return api.get('/meetings', {
      params,
      paramsSerializer: (p) => serializeParamsWithArrays(p)
    });
  },

  getCalendarMeetings: (params: {
    fromDate?: string;
    toDate?: string;
    statuses?: string[];
    onlyMyMeetings?: boolean;
  }): Promise<ApiResponse<MeetingResponse[]>> => {
    return api.get('/meetings/calendar', {
      params,
      paramsSerializer: (p) => serializeParamsWithArrays(p)
    });
  },

  getMeetingById: (id: string): Promise<ApiResponse<MeetingResponse>> => {
    return api.get(`/meetings/${id}`);
  },

  publishMeeting: (id: string): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${id}/publish`);
  },

  submitApproval: (id: string): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${id}/submit-approval`);
  },

  postponeMeeting: (id: string, data: { newStartTime: string; newEndTime: string; reason?: string }): Promise<ApiResponse<MeetingResponse>> => {
    return api.post(`/meetings/${id}/postpone`, data);
  },

  cancelMeeting: (id: string, reason: string): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${id}/cancel`, null, {
      params: { cancelReason: reason }
    });
  },

  getAgendaItems: (meetingId: string): Promise<ApiResponse<AgendaItemResponse[]>> => {
    return api.get(`/meetings/${meetingId}/agenda-items`);
  },

  getAttendees: (meetingId: string): Promise<ApiResponse<any>> => {
    return api.get(`/meetings/${meetingId}/attendees`);
  },

  sendPrepRequest: (meetingId: string, id: string, data?: { prepDeadline?: string; content?: string }): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/meetings/${meetingId}/agenda-items/${id}/send-prep-request`, data);
  },

  submitDocs: (id: string, documentIds: string[]): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/agenda-items/${id}/submit-docs`, documentIds);
  },

  approveDocs: (id: string): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/agenda-items/${id}/approve`);
  },

  rejectDocs: (id: string, reason: string): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/agenda-items/${id}/reject`, null, {
      params: { reason }
    });
  },

  uploadDocument: (file: File, title?: string, docType?: string, note?: string): Promise<ApiResponse<{ id: string; title: string; fileUrl: string; fileName: string; fileSize: number }>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (docType) formData.append('docType', docType);
    if (note) formData.append('note', note);
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  createMeeting: (data: any): Promise<ApiResponse<MeetingResponse>> => {
    return api.post('/meetings', data);
  },

  updateMeeting: (id: string, data: any): Promise<ApiResponse<MeetingResponse>> => {
    return api.put(`/meetings/${id}`, data);
  },

  createAgendaItem: (meetingId: string, data: any): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/meetings/${meetingId}/agenda-items`, data);
  },

  updateAgendaItem: (meetingId: string, id: string, data: any): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.put(`/meetings/${meetingId}/agenda-items/${id}`, data);
  },

  deleteAgendaItem: (meetingId: string, id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/meetings/${meetingId}/agenda-items/${id}`);
  },

  submitAttendees: (meetingId: string, data: any): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${meetingId}/attendees`, data);
  },

  attachDocument: (meetingId: string, data: any): Promise<ApiResponse<any>> => {
    return api.post(`/meetings/${meetingId}/documents`, data);
  }
};

// Helper để serialize params chứa mảng
const serializeParamsWithArrays = (p: any) => {
  const parts: string[] = [];
  Object.entries(p).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    if (Array.isArray(val)) {
      val.forEach(v => {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
      });
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
    }
  });
  return parts.join('&');
};
