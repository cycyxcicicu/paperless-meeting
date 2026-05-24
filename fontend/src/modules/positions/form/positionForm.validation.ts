import * as z from 'zod';

export const positionFormValidationSchema = z.object({
  name: z.string()
    .min(1, 'Vui lòng nhập tên chức vụ')
    .regex(/^[^0-9!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~]*$/, 'Tên chức vụ không được chứa số hoặc kí tự đặc biệt'),
  code: z.string()
    .min(1, 'Vui lòng nhập mã chức vụ')
    .regex(/^[a-zA-Z0-9]*$/, 'Mã chức vụ chỉ được chứa chữ và số'),
  description: z.string().optional().default(''),
  ordinal: z.coerce.number().min(0, "Thứ tự không thể âm"),
  leader: z.enum(['yes', 'no']),
});
