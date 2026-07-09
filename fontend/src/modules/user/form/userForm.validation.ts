import * as z from 'zod';

export const getUserFormValidationSchema = (roleOptions: { value: string; roleCode?: string }[] = []) => z.object({
  formMode: z.string().optional(),
  username: z.string()
    .min(1, 'Vui lòng nhập tên đăng nhập')
    .max(50, 'Tên đăng nhập không được vượt quá 50 ký tự')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Tên đăng nhập chỉ được chứa chữ cái không dấu, số, dấu chấm (.), gạch ngang (-) và gạch dưới (_)'),
  password: z.string().optional(),
  fullName: z.string()
    .min(1, 'Vui lòng nhập họ và tên')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự')
    .regex(/^[\p{L}\s]+$/u, 'Họ và tên chỉ được chứa chữ cái, không chứa số hay ký tự đặc biệt'),
  email: z.string()
    .min(1, 'Vui lòng nhập email')
    .max(100, 'Email không được vượt quá 100 ký tự')
    .email('Email không đúng định dạng (VD: example@domain.com)'),
  phone: z.string()
    .min(1, 'Vui lòng nhập số điện thoại')
    .max(20, 'Số điện thoại không được vượt quá 20 ký tự')
    .regex(/^(0[35789])[0-9]{8}$/, 'Số điện thoại phải đúng 10 chữ số và bắt đầu bằng số 0 hợp lệ'),
  position: z.string().nullable().optional(),
  department: z.string().min(1, 'Vui lòng chọn đơn vị'),
  role: z.any().optional(),
  status: z.enum(['active', 'inactive']),
  avatar: z.any().optional(),
}).superRefine((data, ctx) => {
  // Logic validation chức vụ động
  const selectedRoleOption = roleOptions.find(o => o.value === data.role);
  const isPositionHidden = selectedRoleOption?.roleCode === 'SUPER_ADMIN' || selectedRoleOption?.roleCode === 'DEPARTMENT_ADMIN';
  
  if (!isPositionHidden) {
    if (!data.position || data.position.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng chọn chức vụ',
        path: ['position']
      });
    }
  }

  // Logic validation đặc biệt: Mật khẩu chỉ bắt buộc khi create
  if (data.formMode !== 'edit' && data.formMode !== 'view') {
    if (!data.password || data.password.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vui lòng nhập mật khẩu', path: ['password'] });
    } else {
      const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/.test(data.password);
      if (!isStrong) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mật khẩu phải từ 8 ký tự, không chứa khoảng trắng, gồm chữ hoa, chữ thường, số và ký tự đặc biệt', path: ['password'] });
      }
    }
  } else {
    // Ở chế độ edit, không bắt buộc nhập mật khẩu. Nếu nhập thì mới validate.
    if (data.password && data.password.trim() !== '') {
      const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/.test(data.password);
      if (!isStrong) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mật khẩu phải từ 8 ký tự, không chứa khoảng trắng, gồm chữ hoa, chữ thường, số và ký tự đặc biệt', path: ['password'] });
      }
    }
  }
});
