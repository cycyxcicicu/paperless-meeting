import * as z from 'zod';

export const roleFormValidationSchema = z.object({
  roleName: z.string()
    .min(1, 'Vui lòng nhập tên vai trò')
    .max(100, 'Tên vai trò không được vượt quá 100 ký tự')
    .regex(/^[^!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~]*$/, 'Tên vai trò không được chứa ký tự đặc biệt'),
  roleCode: z.string()
    .min(1, 'Vui lòng nhập mã vai trò')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã vai trò chỉ được chứa chữ cái, số, dấu gạch ngang và dấu gạch dưới'),
  permCodes: z.array(z.string()).optional(),
});
