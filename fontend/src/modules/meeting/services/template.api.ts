import { api } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/api/types';

export interface DocTemplateResponse {
  id: string;
  name: string;
  code: string;
  contentJson: string; // JSON string containing actual layout fields
  templateType: 'INVITATION' | 'RESOLUTION' | 'OTHER';
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface DocTemplateRequest {
  name: string;
  code: string;
  contentJson: string;
  templateType: 'INVITATION' | 'RESOLUTION' | 'OTHER';
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
}

export const templateApi = {
  list: async (): Promise<ApiResponse<DocTemplateResponse[]>> => {
    return api.get('/invitation-templates');
  },
  
  get: async (id: string): Promise<ApiResponse<DocTemplateResponse>> => {
    return api.get(`/invitation-templates/${id}`);
  },

  create: async (data: DocTemplateRequest): Promise<ApiResponse<DocTemplateResponse>> => {
    return api.post('/invitation-templates', data);
  },

  update: async (id: string, data: DocTemplateRequest): Promise<ApiResponse<DocTemplateResponse>> => {
    return api.put(`/invitation-templates/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/invitation-templates/${id}`);
  },

  exportPdf: async (templateData: any, sampleData: Record<string, string>): Promise<Blob> => {
    return api.post('/invitation-templates/export-pdf', {
      templateData,
      sampleData
    }, {
      responseType: 'blob'
    });
  }
};
