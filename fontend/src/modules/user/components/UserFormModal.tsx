import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, User as UserIcon } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';

// Import Form Engine components and configs
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { createUserFormSchema } from '../form/userForm.schema';
import { userFormValidationSchema } from '../form/userForm.validation';
import { mapUserInitialData, mapUserSubmitPayload } from '../form/userForm.mapper';
import { FormMode } from '@/common/components/form-engine/form.types';
import { roleApi } from '@/modules/role/services/role.api';

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
  /** Khi truyền vào, field Đơn vị sẽ bị khóa cứng (không thể chỉnh sửa) ở cả create lẫn edit */
  lockedUnit?: { value: string; label: string };
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  defaultUnitId,
  isSelfProfile = false,
  lockedUnit,
}) => {
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';
  
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  
  const [dynamicRoleOptions, setDynamicRoleOptions] = useState<{value: string; label: string}[]>([]);

  const methods = useForm<any>({
    resolver: zodResolver(userFormValidationSchema),
    mode: 'onSubmit',
    shouldUnregister: true,
    defaultValues: mapUserInitialData(initialData || null, defaultUnitId)
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode !== 'create') {
        methods.reset({ ...mapUserInitialData(initialData, defaultUnitId), formMode: mode });
        if (typeof initialData.avatar === 'string' && initialData.avatar) {
          setAvatarPreview(initialData.avatar);
        } else {
          setAvatarPreview('');
        }
      } else {
        methods.reset({ ...mapUserInitialData(null, defaultUnitId), formMode: 'create' });
        setAvatarPreview('');
      }

      // Load động sách sách Vai trò từ Backend
      const fetchRoleOptions = async () => {
        try {
          const res = await roleApi.getRoles();
          if (res.success && res.data) {
            setDynamicRoleOptions(res.data.map(r => ({
              value: r.id as string,
              label: r.roleName
            })));
          }
        } catch (e) {
          // Bỏ qua nếu lỗi, giữ options mặc định
        }
      };
      fetchRoleOptions();
    }
  }, [initialData, mode, isOpen, defaultUnitId, methods]);

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

  const onFormSubmit = (data: any) => {
    if (isViewMode) {
      handleClose();
      return;
    }
    
    // Normalize data before submit
    const normalizedData = mapUserSubmitPayload(data, mode === 'edit');
    const payload = initialData?.id ? { ...normalizedData, id: initialData.id } : normalizedData;
    
    onSubmit(payload as UserFormData);
    handleClose();
  };

  const getModalTitle = () => {
    if (isSelfProfile) return 'Hồ sơ cá nhân';
    switch (mode) {
      case 'create': return 'Thêm người dùng mới';
      case 'edit': return 'Cập nhật người dùng';
      case 'view': return 'Thông tin người dùng';
      default: return '';
    }
  };

  // Chiết xuất động Option từ vật thể Đơn vị gửi từ backend (nếu chưa có trong list Mock)
  const rawDept = (initialData as any)?.department;
  const dynDeptOption = (typeof rawDept === 'object' && rawDept !== null)
    ? { value: String(rawDept.id || rawDept.code || rawDept.value || ''), label: String(rawDept.deptName || rawDept.name || '') }
    : null;

  const baseDepartmentOptions = [
    { value: '1', label: 'Văn phòng UBND thành phố Hải Phòng' },
    { value: '2', label: 'Sở Tài chính' },
    { value: '3', label: 'Sở Kế hoạch và Đầu tư' },
    { value: '4', label: 'Sở Xây dựng' },
    { value: '5', label: 'Sở Giao thông vận tải' },
    { value: '6', label: 'Sở Nông nghiệp và Phát triển nông thôn' },
    { value: '7', label: 'Sở Công Thương' },
    { value: '8', label: 'Sở Giáo dục và Đào tạo' },
    { value: '9', label: 'Sở Y tế' },
    { value: '10', label: 'Sở Văn hóa và Thể thao' },
  ];

  let departmentOptions = baseDepartmentOptions;
  if (dynDeptOption && dynDeptOption.value && !departmentOptions.some(o => o.value === dynDeptOption.value)) {
    departmentOptions = [dynDeptOption, ...departmentOptions];
  }

  // Tương tự chèn động Chức vụ
  const rawPos = (initialData as any)?.position;
  const dynPosOption = (typeof rawPos === 'object' && rawPos !== null)
    ? { value: String(rawPos.id || rawPos.code || rawPos.value || ''), label: String(rawPos.positionName || rawPos.name || '') }
    : null;

  let positionOptions = [
    { value: 'giam-doc', label: 'Giám đốc' },
    { value: 'pho-giam-doc', label: 'Phó Giám đốc' },
    { value: 'truong-phong', label: 'Trưởng phòng' },
    { value: 'pho-phong', label: 'Phó phòng' },
    { value: 'chuyen-vien', label: 'Chuyên viên' },
    { value: 'nhan-vien', label: 'Nhân viên' },
  ];
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
  };

  const groups = createUserFormSchema(deps);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onFormSubmit)} className="space-y-6 pt-4" autoComplete="off" noValidate>
          {/* Avatar Upload (Custom implementation outside form engine for now) */}
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
      </FormProvider>
    </Modal>
  );
};
