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
  agendaFile?: { id: string; name: string; url: string };
  
  participantsCount?: number;
  documentsCount?: number;
  canEdit?: boolean;
  canCancel?: boolean;
  canPublish?: boolean;
  canDelete?: boolean;
  canSubmitApproval?: boolean;
  canUploadDocs?: boolean;
  canApprove?: boolean;
  canClose?: boolean;
  rejectReason?: string;
  cancelReason?: string;
  requiresInvitation?: boolean;
  invitationTemplateId?: string;
  invitationContent?: string;
}

export interface AgendaDocumentResponse {
  documentId: string;
  title: string;
  usageType: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  createdByUserId?: string;
  createdByFullName?: string;
}

export interface MotionResponse {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'WITHDRAWN' | 'CLOSED';
  meetingId: string;
  agendaItemId: string;
}

export interface AgendaItemFeedbackResponse {
  id: string;
  authorName: string;
  content: string;
  type: 'INSTRUCTION' | 'REJECTION' | 'RESPONSE';
  createdAt: string;
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
  motions?: MotionResponse[];
  feedbacks?: AgendaItemFeedbackResponse[];
  prepInstructions?: string;
}

export interface MeetingUpsertRequest {
  title: string;
  startTime: string;
  endTime: string;
  locationId?: string;
  departmentId?: string;
  content?: string | null;
  agendaFile?: { id: string; name: string; url: string } | null;
  onlineLink?: string;
  rsvpDeadline?: string;
  lateAfterMinutes?: number;
}

export interface ParticipantRequest {
  userId: string;
  participantRole: 'CHAIR' | 'SECRETARY' | 'PARTICIPANT';
}

export interface GuestRequest {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  note?: string;
}

export interface AttendeesSubmitRequest {
  participants: ParticipantRequest[];
  guests: GuestRequest[];
}

export interface MotionUpsertRequest {
  id?: string;
  title: string;
  description?: string;
}

export interface AgendaItemUpsertRequest {
  id?: string;
  title: string;
  content?: string;
  durationEst: number;
  preparedByUserId?: string;
  startTime: string;
  endTime: string;
  orderNo: number;
  documentIds?: string[];
  motions?: MotionUpsertRequest[];
  prepInstructions?: string;
}

export interface MeetingInvitationPreviewRequest {
  invitationTemplateId: string;
  invitationContent: string;
  inviteeId?: string;
  inviteeType?: 'USER' | 'GUEST';
}

export interface MeetingInvitationPreviewResponse {
  headerTrai: string;
  headerPhai: string;
  ngayThang: string;
  tieuDe: string;
  trichYeu: string;
  noiDung: string;
  chuKy: string;
}

export interface UpdateInviteStatusPayload {
  inviteStatus: 'ACCEPTED' | 'DECLINED';
  declineReason?: string;
  substituteUserId?: string | null;
  substituteName?: string;
  substitutePosition?: string;
  substituteCompany?: string;
  substituteDepartment?: string;
  substituteEmail?: string;
  substitutePhone?: string;
  isFullSession?: boolean;
  absentAgendaItemIds?: string[];
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

  revertToDraft: (id: string): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${id}/revert-draft`);
  },

  submitApproval: (id: string): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${id}/submit-approval`);
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

  previewInvitation: (meetingId: string, payload: MeetingInvitationPreviewRequest): Promise<ApiResponse<MeetingInvitationPreviewResponse>> => {
    return api.post(`/meetings/${meetingId}/invitations/preview`, payload);
  },

  exportInvitationPdf: (meetingId: string, payload: MeetingInvitationPreviewRequest): Promise<Blob> => {
    return api.post(`/meetings/${meetingId}/invitations/export-pdf`, payload, {
      responseType: 'blob'
    });
  },

  sendPrepRequest: (meetingId: string, id: string, data?: { prepDeadline?: string; content?: string }): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/meetings/${meetingId}/agenda-items/${id}/send-prep-request`, data);
  },

  submitDocs: (id: string, documentIds: string[], note?: string): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/agenda-items/${id}/submit-docs`, documentIds, {
      params: note ? { note } : undefined
    });
  },

  addFeedback: (id: string, content: string, type: string): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/agenda-items/${id}/feedbacks`, null, {
      params: { content, type }
    });
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

  createMeeting: (data: MeetingUpsertRequest): Promise<ApiResponse<MeetingResponse>> => {
    return api.post('/meetings', data);
  },

  updateMeeting: (id: string, data: MeetingUpsertRequest): Promise<ApiResponse<MeetingResponse>> => {
    return api.put(`/meetings/${id}`, data);
  },

  updateInvitation: (id: string, data: {
    requiresInvitation: boolean;
    invitationTemplateId: string | null;
    invitationContent: string;
  }): Promise<ApiResponse<void>> => {
    return api.put(`/meetings/${id}/invitation`, data);
  },

  createAgendaItem: (meetingId: string, data: AgendaItemUpsertRequest[]): Promise<ApiResponse<AgendaItemResponse[]>> => {
    return api.post(`/meetings/${meetingId}/agenda-items`, data);
  },

  updateAgendaOrders: (meetingId: string, orders: { id: string; orderNo: number }[]): Promise<ApiResponse<void>> => {
    return api.put(`/meetings/${meetingId}/agenda-items/orders`, { orders });
  },

  deleteAgendaItem: (meetingId: string, id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/meetings/${meetingId}/agenda-items/${id}`);
  },

  startAgenda: (meetingId: string, id: string): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/meetings/${meetingId}/agenda-items/${id}/start`);
  },

  completeAgenda: (meetingId: string, id: string): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/meetings/${meetingId}/agenda-items/${id}/complete`);
  },

  skipAgenda: (meetingId: string, id: string): Promise<ApiResponse<AgendaItemResponse>> => {
    return api.post(`/meetings/${meetingId}/agenda-items/${id}/skip`);
  },

  submitAttendees: (meetingId: string, data: AttendeesSubmitRequest): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${meetingId}/attendees`, data);
  },

  resendEmail: (meetingId: string, attendeeId: string, type: 'INTERNAL' | 'GUEST'): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${meetingId}/attendees/${attendeeId}/resend-email`, null, {
      params: { type }
    });
  },

  attachDocument: (meetingId: string, data: { title: string; docType: string; documentId: string; note?: string }): Promise<ApiResponse<any>> => {
    return api.post(`/meetings/${meetingId}/documents`, data);
  },

  getMeetingDocuments: (meetingId: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/meetings/${meetingId}/documents`);
  },

  detachDocument: (meetingId: string, meetingDocId: string): Promise<ApiResponse<void>> => {
    return api.delete(`/meetings/${meetingId}/documents/${meetingDocId}`);
  },

  getOpinions: (meetingId: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/meetings/${meetingId}/opinions`);
  },

  createOpinion: (meetingId: string, data: { opinionDetail: string; documentName?: string; documentIds?: string[] }): Promise<ApiResponse<any>> => {
    return api.post(`/meetings/${meetingId}/opinions`, data);
  },

  getMeetingMotions: (meetingId: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/meetings/${meetingId}/motions`);
  },

  getSpeakersQueue: (meetingId: string, status?: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/meetings/${meetingId}/speakers/queue`, {
      params: { status }
    });
  },

  approveMeeting: (id: string): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${id}/approve`);
  },

  rejectMeeting: (id: string, rejectReason: string): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${id}/reject`, null, {
      params: { rejectReason }
    });
  },

  closeMeeting: (id: string): Promise<ApiResponse<void>> => {
    return api.post(`/meetings/${id}/close`);
  },

  deleteMeeting: (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/meetings/${id}`);
  },

  getAttendeeStatistics: (meetingId: string): Promise<ApiResponse<any>> => {
    return api.get(`/meetings/${meetingId}/attendees/statistics`);
  },

  updateInviteStatus: (meetingId: string, userId: string, payload: UpdateInviteStatusPayload): Promise<ApiResponse<void>> => {
    return api.put(`/meetings/${meetingId}/participants/${userId}/invite-status`, payload);
  },

  getEligibleSubstitutes: (meetingId: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/meetings/${meetingId}/eligible-substitutes`);
  },

  updateAttendanceStatus: (meetingId: string, attendeeId: string, type: string, attendanceStatus: string, note?: string): Promise<ApiResponse<any>> => {
    return api.put(`/meetings/${meetingId}/attendees/${attendeeId}/attendance`, { attendanceStatus, note }, { params: { type } });
  },

  getVoteStatistics: (motionId: string): Promise<ApiResponse<any>> => {
    return api.get(`/motions/${motionId}/vote-statistics`);
  },

  castVote: (motionId: string, optionId: string): Promise<ApiResponse<any>> => {
    return api.post(`/motions/${motionId}/vote`, { optionId });
  },

  startVote: (motionId: string, durationMinutes?: number): Promise<ApiResponse<any>> => {
    return api.post(`/motions/${motionId}/vote-start`, null, { params: { durationMinutes } });
  },

  stopVote: (motionId: string): Promise<ApiResponse<any>> => {
    return api.post(`/motions/${motionId}/vote-stop`);
  },

  requestToSpeak: (meetingId: string, agendaItemId?: string): Promise<ApiResponse<any>> => {
    return api.post(`/meetings/${meetingId}/speakers/request`, null, { params: { agendaItemId } });
  },

  cancelSpeakRequest: (meetingId: string, queueId: string): Promise<ApiResponse<void>> => {
    return api.delete(`/meetings/${meetingId}/speakers/request/${queueId}`);
  },

  rejectSpeakRequest: (meetingId: string, queueId: string): Promise<ApiResponse<void>> => {
    return api.put(`/meetings/${meetingId}/speakers/reject/${queueId}`);
  },

  startSpeakerTurn: (meetingId: string, queueId: string, minutes?: number): Promise<ApiResponse<any>> => {
    return api.post(`/meetings/${meetingId}/speakers/start-turn/${queueId}`, { minutes });
  },

  startDirectSpeakerTurn: (meetingId: string, userId: string, minutes?: number): Promise<ApiResponse<any>> => {
    return api.post(`/meetings/${meetingId}/speakers/start-direct-turn`, { userId, minutes });
  },

  stopSpeakerTurn: (meetingId: string, turnId: string): Promise<ApiResponse<any>> => {
    return api.post(`/meetings/${meetingId}/speakers/stop-turn/${turnId}`);
  },

  // ========== Guest Public APIs ==========

  publicGetMeeting: (guestToken: string): Promise<ApiResponse<any>> => {
    return api.get(`/meetings/public`, { params: { guestToken } });
  },

  publicGetAgendaItems: (guestToken: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/meetings/public/agenda-items`, { params: { guestToken } });
  },

  publicGetOpinions: (guestToken: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/meetings/public/opinions`, { params: { guestToken } });
  },

  publicCreateOpinion: (guestToken: string, data: { opinionDetail: string; documentName?: string }): Promise<ApiResponse<any>> => {
    return api.post(`/meetings/public/opinions`, data, { params: { guestToken } });
  },

  publicGetMotions: (guestToken: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/meetings/public/motions`, { params: { guestToken } });
  },

  publicGetSpeakersQueue: (guestToken: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/meetings/public/speakers/queue`, { params: { guestToken } });
  },

  publicGetAttendees: (guestToken: string): Promise<ApiResponse<any>> => {
    return api.get(`/meetings/public/attendees`, { params: { guestToken } });
  },

  publicUpdateAttendanceStatus: (guestToken: string, payload: { attendanceStatus: string; note?: string }): Promise<ApiResponse<any>> => {
    return api.put(`/meetings/public/attendees/attendance`, payload, { params: { guestToken } });
  },

  publicCastVote: (motionId: string, optionId: string, guestToken: string): Promise<ApiResponse<any>> => {
    return api.post(`/meetings/public/motions/${motionId}/vote`, { optionId }, { params: { guestToken } });
  },

  publicRequestToSpeak: (guestToken: string, agendaItemId?: string): Promise<ApiResponse<any>> => {
    return api.post(`/meetings/public/speakers/request`, null, { params: { guestToken, agendaItemId } });
  },

  publicGetVoteStatistics: (motionId: string, guestToken: string): Promise<ApiResponse<any>> => {
    return api.get(`/meetings/public/motions/${motionId}/vote-statistics`, { params: { guestToken } });
  },
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
