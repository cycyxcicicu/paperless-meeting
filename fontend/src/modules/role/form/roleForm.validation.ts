import * as z from 'zod';

export const roleFormValidationSchema = z.object({
  name: z.string()
    .min(1, 'Vui lòng nhập tên vai trò')
    .max(100, 'Tên vai trò không được vượt quá 100 ký tự'),
  code: z.string()
    .min(1, 'Vui lòng nhập mã vai trò')
    .regex(/^[A-Za-z0-9_]+$/, 'Mã vai trò chỉ được chứa chữ cái, số và dấu gạch dưới'),
  description: z.string().optional().default(''),
  permissions: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất một quyền hạn'),
});
