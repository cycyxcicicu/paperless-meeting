import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, User as UserIcon } from 'lucide-react';
import { Button } from '../common/ui/Button';
import { Modal } from '../common/ui/Modal';
import { FormInput } from '../common/form/FormInput';
import { FormSelect } from '../common/form/FormSelect';

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
}

// Zod Schema
const userSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().optional(),
  fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
  phone: z.string().min(1, 'Vui lòng nhập số điện thoại').regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số'),
  position: z.string().min(1, 'Vui lòng chọn chức vụ'),
  department: z.string().min(1, 'Vui lòng chọn đơn vị'),
  status: z.enum(['active', 'inactive']),
  avatar: z.any().optional(),
}).superRefine((data, ctx) => {
  // Logic validation đặc biệt: Khi tạo mới bắt buộc phải có mật khẩu
  if (!data.id && !data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng nhập mật khẩu',
      path: ['password']
    });
  }
  if (!data.id && data.password && data.password.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Mật khẩu phải có ít nhất 6 ký tự',
      path: ['password']
    });
  }
});

type UserFormValues = z.infer<typeof userSchema>;

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  defaultUnitId,
}) => {
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';
  
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const methods = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      position: '',
      department: defaultUnitId || '',
      status: 'active',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode !== 'create') {
        methods.reset(initialData);
        if (typeof initialData.avatar === 'string' && initialData.avatar) {
          setAvatarPreview(initialData.avatar);
        } else {
          setAvatarPreview('');
        }
      } else {
        methods.reset({
          username: '',
          password: '',
          fullName: '',
          email: '',
          phone: '',
          position: '',
          department: defaultUnitId || '',
          status: 'active',
        });
        setAvatarPreview('');
      }
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

  const onFormSubmit = (data: UserFormValues) => {
    if (isViewMode) {
      handleClose();
      return;
    }
    // Gắn ID nếu đang ở chế độ edit
    const payload = initialData?.id ? { ...data, id: initialData.id } : data;
    onSubmit(payload as UserFormData);
    handleClose();
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Thêm người dùng mới';
      case 'edit': return 'Cập nhật người dùng';
      case 'view': return 'Thông tin người dùng';
      default: return '';
    }
  };

  // Options data
  const positionOptions = [
    { value: 'giam-doc', label: 'Giám đốc' },
    { value: 'pho-giam-doc', label: 'Phó Giám đốc' },
    { value: 'truong-phong', label: 'Trưởng phòng' },
    { value: 'pho-phong', label: 'Phó phòng' },
    { value: 'chuyen-vien', label: 'Chuyên viên' },
    { value: 'nhan-vien', label: 'Nhân viên' },
  ];

  const departmentOptions = [
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

  const statusOptions = [
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Ngừng hoạt động' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onFormSubmit)} className="space-y-6 pt-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput name="username" label="Tên đăng nhập" required disabled={isViewMode} />
            {isCreateMode && (
              <FormInput name="password" label="Mật khẩu" type="password" required disabled={isViewMode} />
            )}
            <FormInput name="fullName" label="Họ và tên" required disabled={isViewMode} />
            <FormInput name="email" label="Email" type="email" required disabled={isViewMode} />
            <FormSelect name="department" label="Đơn vị" options={departmentOptions} required disabled={isViewMode} />
            <FormSelect name="position" label="Chức vụ" options={positionOptions} required disabled={isViewMode} />
            <FormInput name="phone" label="Số điện thoại" type="tel" required disabled={isViewMode} />
            <FormSelect name="status" label="Trạng thái" options={statusOptions} required disabled={isViewMode} />
          </div>

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
