import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, User as UserIcon } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';

// Import Form Engine components and configs
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { createUserFormSchema } from '../form/userForm.schema';
import { getUserFormValidationSchema } from '../form/userForm.validation';
import { mapUserInitialData, mapUserSubmitPayload } from '../form/userForm.mapper';
import { FormMode } from '@/common/components/form-engine/form.types';
import { roleApi } from '@/modules/role/services/role.api';
import { positionApi } from '@/modules/positions/services/position.api';
import { departmentApi, DepartmentTreeResponse } from '@/modules/organization/services/department.api';
import { useAuth } from '@/app/context/AuthContext';
import { userApi } from '../services/user.api';

export type ModalMode = 'create' | 'edit' | 'view';

export interface UserFormData {
  id?: number;
  username: string;
  password?: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: 'active' | 'inactive';
  avatar?: File | string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: UserFormData) => void;
  mode: ModalMode;
  initialData?: UserFormData;
  userId?: number;
  defaultUnitId?: string;
  isSelfProfile?: boolean;
  /** Khi truyền vào, field Đơn vị sẽ bị khóa cứng */
  lockedUnit?: { value: string; label: string };
  /** Truyền true để khóa vai trò (từ page cha) */
  lockRole?: boolean;
}

// Helper: flatten department tree
const flattenTree = (nodes: DepartmentTreeResponse[]): { value: string; label: string }[] => {
  const result: { value: string; label: string }[] = [];
  const walk = (list: DepartmentTreeResponse[]) => {
    for (const node of list) {
      result.push({ value: node.id, label: node.deptName });
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return result;
};

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  defaultUnitId,
  isSelfProfile = false,
  lockedUnit,
  userId,
  lockRole: lockRoleProp,
}) => {
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';
  
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  
  const [dynamicRoleOptions, setDynamicRoleOptions] = useState<{value: string; label: string}[]>([]);
  const [dynamicPositionOptions, setDynamicPositionOptions] = useState<{value: string; label: string}[]>([]);
  const [allPositions, setAllPositions] = useState<any[]>([]);
  const [dynamicDepartmentOptions, setDynamicDepartmentOptions] = useState<{value: string; label: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const currentUserRoleCode = user?.role?.roleCode || 'USER';
  const lockRole = lockRoleProp ?? (currentUserRoleCode === 'DEPARTMENT_ADMIN');

  const hidePosition = currentUserRoleCode === 'SUPER_ADMIN';

  const methods = useForm<any>({
    resolver: zodResolver(getUserFormValidationSchema(hidePosition)),
    mode: 'onSubmit',
    shouldUnregister: true,
    defaultValues: mapUserInitialData(initialData || null, defaultUnitId)
  });

  useEffect(() => {
    if (isOpen) {
      const loadAllData = async () => {
        setIsLoading(true);
        let roles: any[] = [];

        // 1) Load roles
        try {
          const res = await roleApi.getRoles();
          if (res.success && res.data) {
            roles = res.data;
            setDynamicRoleOptions(roles.map(r => ({
              value: r.id as string,
              label: r.roleName
            })));
          }
        } catch (e) {}

        // 2) Load departments from API tree
        try {
          const res = await departmentApi.getTree();
          if (res.success && res.data) {
            setDynamicDepartmentOptions(flattenTree(res.data));
          }
        } catch (e) {
          console.error("Lỗi khi load danh sách đơn vị:", e);
        }

        // 3) Load positions global
        try {
          const res = await positionApi.getPositions(undefined, 0, 1000);
          if (res.success && res.data) {
            const rawData: any = res.data;
            const content = Array.isArray(rawData) ? rawData : (rawData.content || []);
            setAllPositions(content);
          }
        } catch (e) {
          console.error("Lỗi khi load danh sách chức vụ:", e);
        }

        // 4) Load user details for edit/view
        if (mode !== 'create' && (userId || initialData?.id)) {
          const idToFetch = userId || initialData?.id;
          if (idToFetch) {
            try {
              const res = await userApi.getUserById(idToFetch);
              if (res.success && res.data) {
                methods.reset({ 
                  ...mapUserInitialData(res.data as any, defaultUnitId), 
                  formMode: mode 
                });
                const userData = res.data as any;
                if (typeof userData.avatar === 'string' && userData.avatar) {
                  setAvatarPreview(userData.avatar);
                } else {
                  setAvatarPreview('');
                }
              }
            } catch (e) {
              if (initialData) {
                methods.reset({ ...mapUserInitialData(initialData, defaultUnitId), formMode: mode });
              }
            }
          }
        } else {
          if (initialData && mode !== 'create') {
            methods.reset({ ...mapUserInitialData(initialData, defaultUnitId), formMode: mode });
          } else {
            methods.reset({ ...mapUserInitialData(null, defaultUnitId), formMode: 'create' });
          }
          setAvatarPreview('');
        }

        // 5) Lock role to USER for DEPARTMENT_ADMIN
        if (lockRole) {
          const userRole = roles.find(r => r.roleCode === 'USER');
          if (userRole) {
            methods.setValue('role', String(userRole.id));
          }
        }
        setIsLoading(false);
      };

      loadAllData();
    }
  }, [initialData, mode, isOpen, defaultUnitId, userId, methods, lockRole]);

  // Thay vì lọc cứng theo selectedDepartment, Frontend sẽ load toàn bộ allPositions
  // (do danh sách allPositions từ backend đã được bảo đảm tính phân quyền cho đơn vị đó)
  useEffect(() => {
    if (!allPositions || allPositions.length === 0) return;

    setDynamicPositionOptions(allPositions.map((p: any) => ({
      value: String(p.id),
      label: p.positionName || p.name
    })));
  }, [allPositions, isOpen]);

  const handleClose = () => {
    methods.reset();
    setAvatarPreview('');
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('Chỉ cho phép upload file ảnh (JPG, PNG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 2MB');
      return;
    }

    methods.setValue('avatar', file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onFormSubmit = async (data: any) => {
    if (isViewMode) {
      handleClose();
      return;
    }
    
    // Normalize data before submit
    const normalizedData = mapUserSubmitPayload(data, mode === 'edit');
    const payload = initialData?.id ? { ...normalizedData, id: initialData.id } : normalizedData;
    
    try {
      await onSubmit(payload as UserFormData);
      handleClose();
    } catch (e) {
      // If parent throws, don't close.
    }
  };

  const getModalTitle = () => {
    if (isSelfProfile) return 'Hồ sơ cá nhân';
    const isSuperAdmin = currentUserRoleCode === 'SUPER_ADMIN';
    switch (mode) {
      case 'create': return isSuperAdmin ? 'Thêm admin đơn vị' : 'Thêm nhân sự phòng/bộ phận';
      case 'edit': return isSuperAdmin ? 'Cập nhật admin đơn vị' : 'Cập nhật nhân sự phòng/bộ phận';
      case 'view': return isSuperAdmin ? 'Thông tin admin đơn vị' : 'Thông tin nhân sự phòng/bộ phận';
      default: return '';
    }
  };

  // Chiết xuất động Option từ vật thể Đơn vị gửi từ backend
  const rawDept = (initialData as any)?.department;
  const dynDeptOption = (typeof rawDept === 'object' && rawDept !== null)
    ? { value: String(rawDept.id || rawDept.code || rawDept.value || ''), label: String(rawDept.deptName || rawDept.name || '') }
    : null;

  let departmentOptions = [...dynamicDepartmentOptions];
  if (dynDeptOption && dynDeptOption.value && !departmentOptions.some(o => o.value === dynDeptOption.value)) {
    departmentOptions = [dynDeptOption, ...departmentOptions];
  }

  // Tương tự chèn động Chức vụ
  const rawPos = (initialData as any)?.position;
  const dynPosOption = (typeof rawPos === 'object' && rawPos !== null)
    ? { value: String(rawPos.id || rawPos.code || rawPos.value || ''), label: String(rawPos.positionName || rawPos.name || '') }
    : null;

  let positionOptions = [...dynamicPositionOptions];
  if (dynPosOption && dynPosOption.value && !positionOptions.some(o => o.value === dynPosOption.value)) {
    positionOptions = [dynPosOption, ...positionOptions];
  }

  // Tương tự chèn động Vai trò
  const rawRole = (initialData as any)?.role;
  const dynRoleOption = (typeof rawRole === 'object' && rawRole !== null)
    ? { value: String(rawRole.id || rawRole.code || rawRole.value || ''), label: String(rawRole.name || rawRole.roleName || rawRole.label || '') }
    : null;

  let roleOptions = [...dynamicRoleOptions];
  if (dynRoleOption && dynRoleOption.value && !roleOptions.some(o => o.value === dynRoleOption.value)) {
    roleOptions = [dynRoleOption, ...roleOptions];
  }

  if (lockedUnit) {
    departmentOptions = [lockedUnit, ...departmentOptions.filter(o => o.value !== lockedUnit.value)];
  }

  const deps = {
    positionOptions,
    departmentOptions,
    roleOptions,
    statusOptions: [
      { value: 'active', label: 'Hoạt động' },
      { value: 'inactive', label: 'Ngừng hoạt động' },
    ],
    isSelfProfile,
    lockDepartment: !!lockedUnit,
    lockRole,
    hidePosition: currentUserRoleCode === 'SUPER_ADMIN',
  };

  const groups = createUserFormSchema(deps);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
      preventAutoFocus={true}
    >
      <FormProvider {...methods}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-[#C8102E]"></div>
            <p className="text-gray-500 font-medium heading text-sm animate-pulse">Đang nạp dữ liệu...</p>
          </div>
        ) : (
          <form onSubmit={methods.handleSubmit(onFormSubmit)} className="space-y-6 pt-4" autoComplete="off" noValidate>
            {/* Avatar Upload */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                {!isViewMode && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors shadow-lg">
                    <Upload className="h-4 w-4 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Form Engine Layout */}
            <DynamicFormRenderer groups={groups} mode={mode as FormMode} />

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={handleClose}>
                {isViewMode ? 'Đóng' : 'Hủy bỏ'}
              </Button>
              {!isViewMode && (
                <Button type="submit" variant="primary">
                  {isCreateMode ? 'Thêm mới' : 'Lưu thay đổi'}
                </Button>
              )}
            </div>
          </form>
        )}
      </FormProvider>
    </Modal>
  );
};
