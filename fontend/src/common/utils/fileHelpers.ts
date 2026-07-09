import { FileText, FileSpreadsheet, Presentation, File as FileIcon } from 'lucide-react';

/**
 * Centralized utility functions for handling secure document viewing and downloading.
 */

/**
 * Opens a secure preview tab for PDF documents.
 * @param documentId Unique identifier of the document
 */
export const viewDocument = (documentId: string | undefined, guestToken?: string | null): void => {
  if (!documentId) return;
  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  if (guestToken) {
    window.open(`${baseUrl}/meetings/public/documents/${documentId}/download?guestToken=${guestToken}&inline=true`, "_blank");
  } else {
    window.open(`${baseUrl}/documents/${documentId}/download?inline=true`, "_blank");
  }
};

/**
 * Triggers a direct download of a document without opening any blank tabs.
 * @param documentId Unique identifier of the document
 * @param fileName Optional filename for the download attribute
 * @param guestToken Optional guest token for public access
 */
export const downloadDocument = (
  documentId: string | undefined, 
  fileName?: string, 
  guestToken?: string | null
): void => {
  if (!documentId) return;
  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  const link = document.createElement("a");
  if (guestToken) {
    link.href = `${baseUrl}/meetings/public/documents/${documentId}/download?guestToken=${guestToken}`;
  } else {
    link.href = `${baseUrl}/documents/${documentId}/download`;
  }
  link.setAttribute("download", fileName || "document");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export interface FileIconStyle {
  bg: string;
  text: string;
  icon: any;
}

/**
 * Returns unified styling and Lucide icon components based on the file name/extension.
 */
export const getFileIconStyle = (fileName?: string): FileIconStyle => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    return {
      bg: 'bg-red-50',
      text: 'text-[#C8102E]',
      icon: FileText
    };
  }
  if (ext === 'doc' || ext === 'docx') {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: FileText
    };
  }
  if (ext === 'xls' || ext === 'xlsx') {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      icon: FileSpreadsheet
    };
  }
  if (ext === 'ppt' || ext === 'pptx') {
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      icon: Presentation
    };
  }
  if (ext === 'txt') {
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      icon: FileText
    };
  }
  return {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    icon: FileIcon
  };
};

