import { UnitFormValues } from './unitForm.validation';
import { UnitFormData } from '../components/UnitFormModal';

export const unitFormMapper = {
  // Map from API data (UnitFormData) to Form values (UnitFormValues)
  fromApiToForm: (data: UnitFormData | undefined): UnitFormValues => {
    if (!data) {
      return {
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        foundedDate: '',
        status: 'active',
        description: '',
      };
    }

    return {
      name: data.name || '',
      code: data.code || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      foundedDate: data.foundedDate || '',
      status: data.status || 'active',
      description: data.description || '',
    };
  },

  // Map from Form values to API payload
  fromFormToApi: (values: UnitFormValues, id?: string): UnitFormData => {
    return {
      ...(id ? { id } : {}),
      name: values.name.trim(),
      code: values.code.trim(),
      address: values.address.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      foundedDate: values.foundedDate,
      status: values.status,
      description: values.description?.trim() || '',
    };
  },
};
