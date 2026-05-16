import { FormFieldConfig } from '@/common/components/form-engine/form.types';

export const positionFormSchema: FormFieldConfig[] = [
  {
    key: 'name',
    label: 'Tên chức vụ',
    type: 'text',
    required: true,
    col: 'col-span-1',
    allowedChars: 'letters',
  },
  {
    key: 'code',
    label: 'Mã chức vụ',
    type: 'text',
    required: true,
    col: 'col-span-1',
    allowedChars: 'alphanumeric',
    uppercase: true,
  },
  {
    key: 'description',
    label: 'Mô tả',
    type: 'textarea',
    rows: 3,
    required: false,
    col: 'col-span-2',
    showPlaceholder: true,
  },
];
