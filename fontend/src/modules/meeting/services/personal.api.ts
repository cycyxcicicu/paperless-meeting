import { api } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/api/types';
import { PageResponse, MeetingResponse } from './meeting.api';

export interface PersonalNoteResponse {
  id: string;
  meetingId: string;
  meetingTitle: string;
  agendaItemId?: string | null;
  agendaItemTitle?: string | null;
  noteContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalNoteRequest {
  meetingId: string;
  agendaItemId?: string | null;
  noteContent: string;
}

export const personalApi = {
  // ========== Saved Meetings (Bookmarks) ==========
  toggleSaveMeeting: async (meetingId: string): Promise<ApiResponse<boolean>> => {
    return api.post('/saved-meetings/toggle', null, { params: { meetingId } });
  },

  getSavedMeetings: async (params?: { page?: number; size?: number }): Promise<ApiResponse<PageResponse<MeetingResponse>>> => {
    return api.get('/saved-meetings', { params });
  },

  isMeetingSaved: async (meetingId: string): Promise<ApiResponse<boolean>> => {
    return api.get(`/saved-meetings/check/${meetingId}`);
  },

  // ========== Personal Notes ==========
  createNote: async (data: PersonalNoteRequest): Promise<ApiResponse<PersonalNoteResponse>> => {
    return api.post('/personal-notes', data);
  },

  updateNote: async (id: string, data: PersonalNoteRequest): Promise<ApiResponse<PersonalNoteResponse>> => {
    return api.put(`/personal-notes/${id}`, data);
  },

  deleteNote: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/personal-notes/${id}`);
  },

  getNotesForMeeting: async (meetingId: string): Promise<ApiResponse<PersonalNoteResponse[]>> => {
    return api.get(`/personal-notes/meeting/${meetingId}`);
  },

  getAllNotes: async (params?: { page?: number; size?: number }): Promise<ApiResponse<PageResponse<PersonalNoteResponse>>> => {
    return api.get('/personal-notes', { params });
  },

  getMeetingsWithNotes: async (): Promise<ApiResponse<any[]>> => {
    const res = await personalApi.getAllNotes({ page: 0, size: 1000 });
    if (res.success && res.data && res.data.content) {
      const meetingsMap: Record<string, { id: string; title: string; startTime: string; noteCount: number }> = {};
      res.data.content.forEach((note) => {
        if (!meetingsMap[note.meetingId]) {
          meetingsMap[note.meetingId] = {
            id: note.meetingId,
            title: note.meetingTitle,
            startTime: note.createdAt, // Fallback to note creation date
            noteCount: 0,
          };
        }
        meetingsMap[note.meetingId].noteCount++;
      });
      return {
        success: true,
        data: Object.values(meetingsMap),
        code: 200,
        message: 'Success',
      };
    }
    return {
      success: false,
      data: [],
      code: res.code,
      message: res.message,
    };
  },
};
