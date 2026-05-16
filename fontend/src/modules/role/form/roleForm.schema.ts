import { FormFieldGroup } from '@/common/components/form-engine/form.types';

// Danh sách quyền hạn
export const PERMISSION_OPTIONS = [
  { value: 'view_dashboard', label: 'Xem trang tổng quan' },
  { value: 'manage_users', label: 'Quản lý' },
  { value: 'manage_roles', label: 'Quản lý vai trò' },
  { value: 'create_meeting', label: 'Tạo cuộc họp' },
  { value: 'edit_meeting', label: 'Sửa cuộc họp' },
  { value: 'delete_meeting', label: 'Xóa cuộc họp' },
  { value: 'view_documents', label: 'Xem tài liệu' },
  { value: 'upload_documents', label: 'Tải lên tài liệu' },
  { value: 'manage_settings', label: 'Quản lý cài đặt' },
];

export const createRoleFormSchema = (): FormFieldGroup[] => {
  return [
    {
      id: 'main-info',
      className: 'grid-cols-1 gap-5',
      fields: [
        {
          key: 'name',
          label: 'Tên vai trò',
          type: 'text',
          required: true,
          showPlaceholder: false,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
          allowedChars: 'letters',
        },
        {
          key: 'code',
          label: 'Mã vai trò',
          type: 'text',
          required: true,
          showPlaceholder: false,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
          allowedChars: 'alphanumeric',
          uppercase: true,
        },
        {
          key: 'description',
          label: 'Mô tả',
          type: 'textarea',
          showPlaceholder: false,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
          rows: 4,
        },
        {
          key: 'permissions',
          label: 'Quyền hạn',
          type: 'select',
          multiple: true,
          options: PERMISSION_OPTIONS,
          required: true,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
        },
      ],
    },
  ];
};
