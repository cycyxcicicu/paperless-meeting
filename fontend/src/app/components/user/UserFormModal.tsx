import React, { useState, useEffect } from 'react';
import { X, Upload, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/hp-button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { CustomSelect } from '../ui/CustomSelect';
import { cn } from '../../../lib/utils';

type ModalMode = 'create' | 'edit' | 'view';

interface UserFormData {
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

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  userId,
  defaultUnitId,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

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

  useEffect(() => {
    if (initialData && mode !== 'create') {
      setFormData(initialData);
      if (typeof initialData.avatar === 'string' && initialData.avatar) {
        setAvatarPreview(initialData.avatar);
      }
    } else {
      resetForm();
    }
  }, [initialData, mode, isOpen, defaultUnitId]);

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      position: '',
      department: defaultUnitId || '',
      status: 'active',
    });
    setErrors({});
    setAvatarPreview('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ cho phép upload file ảnh (JPG, PNG)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 2MB');
      return;
    }

    setFormData({ ...formData, avatar: file });

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    }

    if (isCreateMode && !formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (isCreateMode && formData.password && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không đúng định dạng';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
    }

    if (!formData.position) {
      newErrors.position = 'Vui lòng chọn chức vụ';
    }

    if (!formData.department) {
      newErrors.department = 'Vui lòng chọn đơn vị';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isViewMode) {
      handleClose();
      return;
    }

    if (!validate()) {
      return;
    }

    onSubmit(formData);
    handleClose();
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create':
        return 'Thêm người dùng mới';
      case 'edit':
        return 'Cập nhật người dùng';
      case 'view':
        return 'Thông tin người dùng';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 animate-in fade-in-0 zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{getModalTitle()}</h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">
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
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#C8102E] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#A90F14] transition-colors shadow-lg">
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

            {/* Form Fields - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Nhập tên đăng nhập"
                  disabled={isViewMode}
                  className={cn(
                    'h-10 rounded-xl border-gray-300 hover:border-gray-400',
                    errors.username && 'border-red-500 focus-visible:ring-red-500'
                  )}
                />
                {errors.username && (
                  <p className="text-xs text-red-600 font-medium">{errors.username}</p>
                )}
              </div>

              {/* Password */}
              {isCreateMode && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Mật khẩu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Nhập mật khẩu"
                    className={cn(
                      'h-10 rounded-xl border-gray-300 hover:border-gray-400',
                      errors.password && 'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-600 font-medium">{errors.password}</p>
                  )}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nhập họ và tên"
                  disabled={isViewMode}
                  className={cn(
                    'h-10 rounded-xl border-gray-300 hover:border-gray-400',
                    errors.fullName && 'border-red-500 focus-visible:ring-red-500'
                  )}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 font-medium">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Nhập địa chỉ email"
                  disabled={isViewMode}
                  className={cn(
                    'h-10 rounded-xl border-gray-300 hover:border-gray-400',
                    errors.email && 'border-red-500 focus-visible:ring-red-500'
                  )}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Đơn vị <span className="text-red-500">*</span>
                </Label>
                <CustomSelect
                  value={formData.department}
                  onChange={(value) => setFormData({ ...formData, department: value })}
                  options={departmentOptions}
                  placeholder="Chọn đơn vị"
                  disabled={isViewMode}
                  searchable
                  searchPlaceholder="Tìm kiếm đơn vị..."
                  usePortal={true}
                  className={cn(
                    errors.department && 'ring-2 ring-red-500'
                  )}
                />
                {errors.department && (
                  <p className="text-xs text-red-600 font-medium">{errors.department}</p>
                )}
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                  Chức vụ <span className="text-red-500">*</span>
                </Label>
                <CustomSelect
                  value={formData.position}
                  onChange={(value) => setFormData({ ...formData, position: value })}
                  options={positionOptions}
                  placeholder="Chọn chức vụ"
                  disabled={isViewMode}
                  searchable
                  searchPlaceholder="Tìm kiếm chức vụ..."
                  usePortal={true}
                  className={cn(
                    errors.position && 'ring-2 ring-red-500'
                  )}
                />
                {errors.position && (
                  <p className="text-xs text-red-600 font-medium">{errors.position}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  disabled={isViewMode}
                  className={cn(
                    'h-10 rounded-xl border-gray-300 hover:border-gray-400',
                    errors.phone && 'border-red-500 focus-visible:ring-red-500'
                  )}
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 font-medium">{errors.phone}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Trạng thái <span className="text-red-500">*</span>
                </Label>
                <CustomSelect
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
                  options={statusOptions}
                  placeholder="Chọn trạng thái"
                  disabled={isViewMode}
                  usePortal={true}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-5 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              {isViewMode ? 'Đóng' : 'Hủy bỏ'}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                variant="primary"
                className="px-5 py-2 bg-[#C8102E] hover:bg-[#a80d26]"
              >
                {isCreateMode ? 'Thêm mới' : 'Lưu thay đổi'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
