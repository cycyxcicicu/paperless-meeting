import { FormFieldGroup } from '@/common/components/form-engine/form.types';

export const createUserFormSchema = (deps: {
  departmentOptions: { value: string; label: string }[];
  positionOptions: { value: string; label: string }[];
  roleOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  isSelfProfile?: boolean;
  /** Khóa field đơn vị ở cả create lẫn edit, chỉ hiển thị */
  lockDepartment?: boolean;
}): FormFieldGroup[] => {
  const { isSelfProfile = false, lockDepartment = false } = deps;
  
  return [
    {
      id: 'main-info',
      className: 'grid-cols-1 md:grid-cols-2 gap-5',
      fields: [
        {
          key: 'username',
          label: 'Tên đăng nhập',
          type: 'text',
          required: true,
          showPlaceholder: false,
          disabled: ({ mode }) => mode === 'view' || isSelfProfile, // Khóa khi là hồ sơ cá nhân
          col: 'col-span-1',
          allowedChars: 'alphanumeric',
        },
        {
          key: 'password',
          label: 'Mật khẩu',
          type: 'password',
          required: true,
          showPlaceholder: false,
          hidden: ({ mode }) => mode !== 'create',
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
          minLength: 8,
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/,
          errorMessages: {
            required: 'Vui lòng nhập mật khẩu',
            minLength: 'Mật khẩu phải có ít nhất 8 ký tự',
            pattern: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
          }
        },
        {
          key: 'fullName',
          label: 'Họ và tên',
          type: 'text',
          required: true,
          showPlaceholder: false,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
          allowedChars: 'letters',
        },
        {
          key: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          showPlaceholder: false,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
        },
        {
          key: 'department',
          label: 'Đơn vị',
          type: 'select',
          options: deps.departmentOptions,
          placeholder: 'Chọn đơn vị',
          required: true,
          disabled: ({ mode }) => mode === 'view' || isSelfProfile || lockDepartment, // Khóa khi là hồ sơ cá nhân hoặc khi được mở từ cây đơn vị
          col: 'col-span-1',
        },
        {
          key: 'position',
          label: 'Chức vụ',
          type: 'select',
          options: deps.positionOptions,
          placeholder: 'Chọn chức vụ',
          required: true,
          disabled: ({ mode }) => mode === 'view' || isSelfProfile, // Khóa khi là hồ sơ cá nhân
          col: 'col-span-1',
        },
        {
          key: 'phone',
          label: 'Số điện thoại',
          type: 'phone',
          required: true,
          showPlaceholder: false,
          disabled: ({ mode }) => mode === 'view',
          col: 'col-span-1',
        },
        {
          key: 'status',
          label: 'Trạng thái',
          type: 'select',
          options: deps.statusOptions,
          required: true,
          disabled: ({ mode }) => mode === 'view' || isSelfProfile, // Khóa khi là hồ sơ cá nhân
          col: 'col-span-1',
        },
        {
          key: 'role',
          label: 'Vai trò (Phân quyền)',
          type: 'select',
          options: deps.roleOptions,
          required: true,
          disabled: ({ mode }) => mode === 'view' || isSelfProfile,
          col: 'col-span-1',
        },
      ],
    },
  ];
};
