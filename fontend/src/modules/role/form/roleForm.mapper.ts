import { trimFormValues } from '@/common/components/form-engine/form.utils';

export const mapRoleInitialData = (apiData: any) => {
  if (!apiData) {
    return {
      name: '',
      code: '',
      description: '',
      permissions: [],
    };
  }

  return {
    name: apiData.name || '',
    code: apiData.code || '',
    description: apiData.description || '',
    permissions: apiData.permissions || [],
  };
};

export const mapRoleSubmitPayload = (formValues: any) => {
  return trimFormValues(formValues);
};
