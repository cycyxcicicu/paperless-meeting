import * as z from 'zod';

export const userFormValidationSchema = z.object({
  formMode: z.string().optional(),
  username: z.string()
    .min(1, 'Vui lòng nhập tên đăng nhập')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Tên đăng nhập chỉ được chứa chữ cái không dấu, số, dấu chấm (.), gạch ngang (-) và gạch dưới (_)'),
  password: z.string().optional(),
  fullName: z.string()
    .min(1, 'Vui lòng nhập họ và tên')
    .regex(/^[\p{L}\s]+$/u, 'Họ và tên chỉ được chứa chữ cái, không chứa số hay ký tự đặc biệt'),
  email: z.string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không đúng định dạng (VD: example@domain.com)'),
  phone: z.string()
    .min(1, 'Vui lòng nhập số điện thoại')
    .regex(/^(0[35789])[0-9]{8}$/, 'Số điện thoại phải đúng 10 chữ số và bắt đầu bằng số 0 hợp lệ'),
  position: z.string().min(1, 'Vui lòng chọn chức vụ'),
  department: z.string().min(1, 'Vui lòng chọn đơn vị'),
  status: z.enum(['active', 'inactive']),
  avatar: z.any().optional(),
}).superRefine((data, ctx) => {
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
