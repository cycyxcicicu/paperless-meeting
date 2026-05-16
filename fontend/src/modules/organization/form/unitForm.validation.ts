import * as z from 'zod';

export const unitValidationSchema = z.object({
  name: z.string().min(1, 'Tên đơn vị là bắt buộc'),
  code: z.string().min(1, 'Mã đơn vị là bắt buộc'),
  phone: z.string().min(1, 'Số điện thoại là bắt buộc').regex(/^[0-9\s.\-()]+$/, 'Số điện thoại không hợp lệ'),
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  address: z.string().min(1, 'Địa chỉ là bắt buộc'),
  foundedDate: z.union([z.string(), z.date()]).refine(val => !!val, { message: 'Ngày thành lập là bắt buộc' }),
  status: z.enum(['active', 'inactive']).default('active'),
  description: z.string().optional().default(''),
});

export type UnitFormValues = z.infer<typeof unitValidationSchema>;
