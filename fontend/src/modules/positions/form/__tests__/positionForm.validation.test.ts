import { describe, it, expect } from 'vitest';
import { positionFormValidationSchema } from '../positionForm.validation';

describe('positionForm.validation', () => {
  const validData = {
    name: 'Chuyên viên chính',
    code: 'CVC',
    description: 'Chuyên viên chính khối văn phòng',
    ordinal: 5,
    leader: 'no' as const,
  };

  it('should pass validation with valid data', () => {
    const result = positionFormValidationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail validation when name contains numbers or special characters', () => {
    const numericNameResult = positionFormValidationSchema.safeParse({ ...validData, name: 'Chuyên viên 2' });
    expect(numericNameResult.success).toBe(false);

    const specialNameResult = positionFormValidationSchema.safeParse({ ...validData, name: 'Chuyên viên!' });
    expect(specialNameResult.success).toBe(false);
  });

  it('should fail validation when code contains special characters', () => {
    const specialCodeResult = positionFormValidationSchema.safeParse({ ...validData, code: 'CV-1' });
    expect(specialCodeResult.success).toBe(false);
  });

  it('should fail validation when ordinal is negative', () => {
    const negativeOrdinalResult = positionFormValidationSchema.safeParse({ ...validData, ordinal: -1 });
    expect(negativeOrdinalResult.success).toBe(false);
  });
});
