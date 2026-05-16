import { trimFormValues } from '@/common/components/form-engine/form.utils';

export const mapUserInitialData = (apiData: any, defaultUnitId?: string) => {
  if (!apiData) {
    return {
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      position: '',
      department: defaultUnitId || '',
      status: 'active',
    };
  }

  return {
    ...apiData,
    password: '', // Always clear password on edit
    department: apiData.department || defaultUnitId || '',
  };
};

export const mapUserSubmitPayload = (formValues: any, isEditMode: boolean) => {
  const trimmed = trimFormValues(formValues);
  
  // Clean up unused fields
  if (isEditMode) {
    delete trimmed.password;
  }
  
  return trimmed;
};
