import { describe, it, expect } from 'vitest';
import { getUnitValidationSchema } from '../unitForm.validation';

describe('unitForm.validation', () => {
  const schema = getUnitValidationSchema('đơn vị');

  const validData = {
    name: 'Sở Kế Hoạch và Đầu Tư',
    code: 'SKHDT',
    phone: '02253842123',
    email: 'sokhdt@haiphong.gov.vn',
    address: 'Số 1 Đinh Tiên Hoàng, Hồng Bàng, Hải Phòng',
    foundedDate: '2026-01-01',
    status: 'active' as const,
    description: 'Sở quản lý kế hoạch thành phố',
  };

  it('should pass validation with valid data', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail validation when name is empty or too long', () => {
    const emptyNameResult = schema.safeParse({ ...validData, name: '' });
    expect(emptyNameResult.success).toBe(false);

    const longNameResult = schema.safeParse({ ...validData, name: 'a'.repeat(101) });
    expect(longNameResult.success).toBe(false);
  });

  it('should fail validation when code is empty or too long', () => {
    const emptyCodeResult = schema.safeParse({ ...validData, code: '' });
    expect(emptyCodeResult.success).toBe(false);

    const longCodeResult = schema.safeParse({ ...validData, code: 'a'.repeat(51) });
    expect(longCodeResult.success).toBe(false);
  });

  it('should fail validation when phone is invalid', () => {
    const invalidPhoneResult = schema.safeParse({ ...validData, phone: 'phone123' });
    expect(invalidPhoneResult.success).toBe(false);
  });

  it('should fail validation when email is invalid', () => {
    const invalidEmailResult = schema.safeParse({ ...validData, email: 'invalid-email' });
    expect(invalidEmailResult.success).toBe(false);
  });

  it('should fail validation when address is empty', () => {
    const emptyAddressResult = schema.safeParse({ ...validData, address: '' });
    expect(emptyAddressResult.success).toBe(false);
  });

  it('should fail validation when foundedDate is missing', () => {
    const missingDateResult = schema.safeParse({ ...validData, foundedDate: '' });
    expect(missingDateResult.success).toBe(false);
  });
});
