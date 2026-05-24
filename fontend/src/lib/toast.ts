import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      style: { whiteSpace: 'pre-line' }
    });
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      style: { whiteSpace: 'pre-line' }
    });
  },

  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      style: { whiteSpace: 'pre-line' }
    });
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      style: { whiteSpace: 'pre-line' }
    });
  },
};
