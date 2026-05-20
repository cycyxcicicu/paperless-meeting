import { trimFormValues } from '@/common/components/form-engine/form.utils';

export const mapRoleInitialData = (apiData: any) => {
  if (!apiData) {
    return {
      roleName: '',
      roleCode: '',
      permCodes: [],
    };
  }

  return {
    roleName: apiData.roleName || '',
    roleCode: apiData.roleCode || '',
    permCodes: apiData.permCodes || [],
  };
};

export const mapRoleSubmitPayload = (formValues: any) => {
  return trimFormValues(formValues);
};
