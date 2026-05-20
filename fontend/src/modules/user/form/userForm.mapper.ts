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

  const extractId = (field: any) => {
    if (typeof field === 'object' && field !== null) {
      return String(field.id || field.code || field.value || field.name || '');
    }
    return String(field || '');
  };

  const statusStr = String(apiData.status || '').toUpperCase();
  const mappedStatus = (statusStr === 'ACTIVE' || statusStr === '1' || statusStr === 'HOẠT ĐỘNG') ? 'active' : 'inactive';

  return {
    ...apiData,
    password: '', // Always clear password on edit
    department: extractId(apiData.department) || defaultUnitId || '',
    position: extractId(apiData.position),
    role: extractId(apiData.role) || apiData.roleId || '',
    status: mappedStatus,
  };
};

export const mapUserSubmitPayload = (formValues: any, isEditMode: boolean) => {
  const trimmed = trimFormValues(formValues);
  
  if (isEditMode) {
    if (!trimmed.password) {
      delete trimmed.password;
    }
  }
  
  // Transform to match Spring Boot DTO (UserUpdateRequest / UserCreateRequest)
  if (trimmed.department) {
    trimmed.departmentId = trimmed.department;
    delete trimmed.department;
  }
  
  if (trimmed.position) {
    trimmed.positionId = trimmed.position;
    delete trimmed.position;
  }
  
  if (trimmed.role) {
    trimmed.roleId = trimmed.role;
    delete trimmed.role;
  }
  
  // Retain roleId if it was in the form payload (in case it wasn't mapped via 'role')
  if (trimmed.role && !trimmed.roleId) {
    trimmed.roleId = typeof trimmed.role === 'object' ? trimmed.role.id : trimmed.role;
    delete trimmed.role;
  }
  
  delete trimmed.formMode;
  
  return trimmed;
};
