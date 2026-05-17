import { FormFieldGroup } from '@/common/components/form-engine/form.types';

export const createMeetingRoomFormSchema = (): FormFieldGroup[] => {
  return [
    {
      id: 'main-info',
      className: 'grid-cols-1 md:grid-cols-2 gap-5',
      fields: [
        {
          key: 'name',
          label: 'Tên phòng họp',
          type: 'text',
          showPlaceholder: false,
          required: true,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1 md:col-span-2',
        },
        {
          key: 'code',
          label: 'Mã phòng họp',
          showPlaceholder: false,
          type: 'text',
          required: true,
          disabled: ({ mode }) => mode === 'view',
          uppercase: true,
          col: 'col-span-1',
        },
        {
          key: 'capacity',
          label: 'Sức chứa (người)',
          type: 'number',
          required: true,
          showPlaceholder: false,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
        },
        {
          key: 'address',
          label: 'Địa chỉ',
          showPlaceholder: false,
          type: 'text',
          required: true,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1 md:col-span-2',
        },
        {
          key: 'status',
          label: 'Trạng thái',
          type: 'select',
          options: [
            { value: 'active', label: 'Đang hoạt động' },
            { value: 'inactive', label: 'Ngừng hoạt động' },
          ],
          required: true,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1 md:col-span-2',
        },
      ],
    },
  ];
};
