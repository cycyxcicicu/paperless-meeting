import * as z from 'zod';

export const getUnitValidationSchema = (unitTypeLabel: string = 'đơn vị') => z.object({
  name: z.string()
    .min(1, `Tên ${unitTypeLabel} là bắt buộc`)
    .max(100, `Tên ${unitTypeLabel} không được vượt quá 100 ký tự`),
  code: z.string()
    .min(1, `Mã ${unitTypeLabel} là bắt buộc`)
    .max(50, `Mã ${unitTypeLabel} không được vượt quá 50 ký tự`),
  phone: z.string()
    .min(1, 'Số điện thoại là bắt buộc')
    .max(20, 'Số điện thoại không được vượt quá 20 ký tự')
    .regex(/^[0-9\s.\-()]+$/, 'Số điện thoại không hợp lệ'),
  email: z.string()
    .min(1, 'Email là bắt buộc')
    .max(100, 'Email không được vượt quá 100 ký tự')
    .email('Email không hợp lệ'),
  address: z.string()
    .min(1, 'Địa chỉ là bắt buộc')
    .max(255, 'Địa chỉ không được vượt quá 255 ký tự'),
  foundedDate: z.union([z.string(), z.date()]).refine(val => !!val, { message: 'Ngày thành lập là bắt buộc' }),
  status: z.enum(['active', 'inactive']).default('active'),
  description: z.string().optional().default(''),
});

export type UnitFormValues = z.infer<ReturnType<typeof getUnitValidationSchema>>;
