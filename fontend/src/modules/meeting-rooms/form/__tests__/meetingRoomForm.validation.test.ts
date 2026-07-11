import { describe, it, expect } from 'vitest';
import { meetingRoomValidationSchema } from '../meetingRoomForm.validation';

describe('meetingRoomForm.validation', () => {
  const validData = {
    name: 'Phòng họp lớn số 1',
    roomCode: 'PH01',
    address: 'Tầng 2, Tòa nhà UBND',
    capacity: 50,
    isActive: true,
    description: 'Trang bị mic, camera họp trực tuyến',
  };

  it('should pass validation with valid data', () => {
    const result = meetingRoomValidationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail validation when name is too short or too long', () => {
    const shortNameResult = meetingRoomValidationSchema.safeParse({ ...validData, name: 'a' });
    expect(shortNameResult.success).toBe(false);

    const longNameResult = meetingRoomValidationSchema.safeParse({ ...validData, name: 'a'.repeat(121) });
    expect(longNameResult.success).toBe(false);
  });

  it('should fail validation when roomCode is empty or too long', () => {
    const emptyCodeResult = meetingRoomValidationSchema.safeParse({ ...validData, roomCode: '' });
    expect(emptyCodeResult.success).toBe(false);

    const longCodeResult = meetingRoomValidationSchema.safeParse({ ...validData, roomCode: 'a'.repeat(51) });
    expect(longCodeResult.success).toBe(false);
  });

  it('should fail validation when capacity is less than 1', () => {
    const zeroCapacityResult = meetingRoomValidationSchema.safeParse({ ...validData, capacity: 0 });
    expect(zeroCapacityResult.success).toBe(false);

    const negativeCapacityResult = meetingRoomValidationSchema.safeParse({ ...validData, capacity: -5 });
    expect(negativeCapacityResult.success).toBe(false);
  });

  it('should preprocess isActive string value to boolean', () => {
    const stringActiveResult = meetingRoomValidationSchema.safeParse({ ...validData, isActive: 'true' });
    expect(stringActiveResult.success).toBe(true);
    expect(stringActiveResult.data?.isActive).toBe(true);
  });
});
