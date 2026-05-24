import { FormFieldGroup } from '@/common/components/form-engine/form.types';

export const createRoleFormSchema = (deps: {
  permissionOptions: { value: string; label: string }[];
}): FormFieldGroup[] => {
  return [
    {
      id: 'main-info',
      className: 'grid-cols-1 gap-5',
      fields: [
        {
          key: 'roleName',
          label: 'Tên vai trò',
          type: 'text',
          required: true,
          showPlaceholder: false,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
          allowedChars: 'no-special',
        },
        {
          key: 'roleCode',
          label: 'Mã vai trò',
          type: 'text',
          required: true,
          showPlaceholder: false,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
          uppercase: true,
        },
        {
          key: 'permCodes',
          label: 'Quyền hạn',
          type: 'select',
          multiple: true,
          options: deps.permissionOptions,
          required: true,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
        },
      ],
    },
  ];
};
