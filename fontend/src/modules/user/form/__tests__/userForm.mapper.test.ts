import { describe, it, expect } from 'vitest';
import { mapUserInitialData, mapUserSubmitPayload } from '../userForm.mapper';

describe('userForm.mapper test suite', () => {
  describe('mapUserInitialData', () => {
    it('should return default values when apiData is null', () => {
      const result = mapUserInitialData(null, 'default-dept-1');
      expect(result).toEqual({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        position: '',
        department: 'default-dept-1',
        status: 'active',
      });
    });

    it('should correctly map raw apiData to form model', () => {
      const apiData = {
        username: 'john.doe',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '0901234567',
        status: 'ACTIVE',
        department: { id: 'dept-123', name: 'Dept A' },
        position: { id: 'pos-123', title: 'Specialist' },
        role: { id: 'role-123', name: 'USER' }
      };

      const result = mapUserInitialData(apiData);
      expect(result.username).toBe('john.doe');
      expect(result.password).toBe(''); // password must be cleared
      expect(result.department).toBe('dept-123');
      expect(result.position).toBe('pos-123');
      expect(result.role).toBe('role-123');
      expect(result.status).toBe('active');
    });

    it('should support string-based nested fields or fallbacks', () => {
      const apiData = {
        department: 'dept-string',
        position: 'pos-string',
        role: 'role-string',
        status: 'INACTIVE'
      };

      const result = mapUserInitialData(apiData);
      expect(result.department).toBe('dept-string');
      expect(result.position).toBe('pos-string');
      expect(result.role).toBe('role-string');
      expect(result.status).toBe('inactive');
    });
  });

  describe('mapUserSubmitPayload', () => {
    it('should correctly map form values to payload for creation', () => {
      const formValues = {
        username: ' john.doe ', // needs trimming
        password: 'SecretPassword123!',
        department: 'dept-123',
        position: 'pos-123',
        role: 'role-123',
        status: 'active',
        formMode: 'create'
      };

      const payload = mapUserSubmitPayload(formValues, false);
      expect(payload.username).toBe('john.doe');
      expect(payload.password).toBe('SecretPassword123!');
      expect(payload.departmentId).toBe('dept-123');
      expect(payload.positionId).toBe('pos-123');
      expect(payload.roleId).toBe('role-123');
      expect(payload.status).toBe('ACTIVE');
      expect(payload.formMode).toBeUndefined();
    });

    it('should delete empty password on edit mode', () => {
      const formValues = {
        username: 'john.doe',
        password: '',
        status: 'inactive',
        formMode: 'edit'
      };

      const payload = mapUserSubmitPayload(formValues, true);
      expect(payload.password).toBeUndefined();
      expect(payload.status).toBe('INACTIVE');
    });
  });
});
