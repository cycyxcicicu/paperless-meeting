import { describe, it, expect } from 'vitest';
import { getUserFormValidationSchema } from '../userForm.validation';

describe('getUserFormValidationSchema test suite', () => {
  const roleOptions = [
    { value: 'role-1', roleCode: 'SUPER_ADMIN' },
    { value: 'role-2', roleCode: 'DEPARTMENT_ADMIN' },
    { value: 'role-3', roleCode: 'USER' }
  ];

  const validBaseData = {
    formMode: 'create',
    username: 'john.doe',
    password: 'Password123!',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '0901234567',
    department: 'dept-1',
    role: 'role-3',
    position: 'pos-1',
    status: 'active' as const
  };

  it('should pass validation with valid data', () => {
    const schema = getUserFormValidationSchema(roleOptions);
    const result = schema.safeParse(validBaseData);
    expect(result.success).toBe(true);
  });

  it('should fail if username contains invalid characters', () => {
    const schema = getUserFormValidationSchema(roleOptions);
    const result = schema.safeParse({
      ...validBaseData,
      username: 'john doe!' // space and ! are invalid
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.username).toContain(
        'Tên đăng nhập chỉ được chứa chữ cái không dấu, số, dấu chấm (.), gạch ngang (-) và gạch dưới (_)'
      );
    }
  });

  it('should fail if fullName contains digits', () => {
    const schema = getUserFormValidationSchema(roleOptions);
    const result = schema.safeParse({
      ...validBaseData,
      fullName: 'John 123'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.fullName).toContain(
        'Họ và tên chỉ được chứa chữ cái, không chứa số hay ký tự đặc biệt'
      );
    }
  });

  it('should validate phone number format', () => {
    const schema = getUserFormValidationSchema(roleOptions);
    
    // Invalid prefix
    const res1 = schema.safeParse({
      ...validBaseData,
      phone: '1234567890'
    });
    expect(res1.success).toBe(false);

    // Invalid length
    const res2 = schema.safeParse({
      ...validBaseData,
      phone: '0901234'
    });
    expect(res2.success).toBe(false);
  });

  it('should require password in create mode', () => {
    const schema = getUserFormValidationSchema(roleOptions);
    const result = schema.safeParse({
      ...validBaseData,
      password: ''
    });
    expect(result.success).toBe(false);
  });

  it('should not require password in edit mode', () => {
    const schema = getUserFormValidationSchema(roleOptions);
    const result = schema.safeParse({
      ...validBaseData,
      formMode: 'edit',
      password: ''
    });
    expect(result.success).toBe(true);
  });

  it('should require position for role USER', () => {
    const schema = getUserFormValidationSchema(roleOptions);
    const result = schema.safeParse({
      ...validBaseData,
      role: 'role-3', // USER
      position: '' // Empty position
    });
    expect(result.success).toBe(false);
  });

  it('should not require position for role SUPER_ADMIN or DEPARTMENT_ADMIN', () => {
    const schema = getUserFormValidationSchema(roleOptions);
    
    // SUPER_ADMIN
    const res1 = schema.safeParse({
      ...validBaseData,
      role: 'role-1',
      position: ''
    });
    expect(res1.success).toBe(true);

    // DEPARTMENT_ADMIN
    const res2 = schema.safeParse({
      ...validBaseData,
      role: 'role-2',
      position: ''
    });
    expect(res2.success).toBe(true);
  });
});
