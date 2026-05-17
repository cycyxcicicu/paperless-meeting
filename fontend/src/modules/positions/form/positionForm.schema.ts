import { FormFieldConfig } from '@/common/components/form-engine/form.types';

export const positionFormSchema: FormFieldConfig[] = [
  {
    key: 'name',
    label: 'Tên chức vụ',
    type: 'text',
    required: true,
    col: 'col-span-1',
    showPlaceholder: false,
    allowedChars: 'letters',
  },
  {
    key: 'code',
    label: 'Mã chức vụ',
    type: 'text',
    required: true,
    col: 'col-span-1',
    showPlaceholder: false,
    allowedChars: 'alphanumeric',
    uppercase: true,
  },
  {
    key: 'ordinal',
    label: 'Thứ tự cấp bậc',
    type: 'number',
    required: true,
    col: 'col-span-1',
    showPlaceholder: false,
  },
  {
    key: 'leader',
    label: 'Lãnh đạo',
    type: 'select',
    required: true,
    col: 'col-span-1',
    options: [
      { value: 'yes', label: 'Có' },
      { value: 'no', label: 'Không' },
    ],
  },
  {
    key: 'description',
    label: 'Mô tả',
    type: 'textarea',
    rows: 3,
    required: false,
    col: 'col-span-2',
    showPlaceholder: false,
  },
];
