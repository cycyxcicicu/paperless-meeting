import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { Button } from '@/app/components/common/ui/Button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { CustomSelect } from '../ui/custom-select';
import { cn } from '../../../lib/utils';

type ModalMode = 'create' | 'edit' | 'view';
type LocationType = 'OFFLINE' | 'ONLINE' | 'HYBRID';

interface LocationFormData {
  id?: string;
  name: string;
  code: string;
  type: LocationType;
  capacity: string;
  address: string;
  onlineLink: string;
  departmentId: string;
}

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (location: LocationFormData) => void;
  mode: ModalMode;
  initialData?: LocationFormData;
}

export const LocationFormModal: React.FC<LocationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
}) => {
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    code: '',
    type: 'OFFLINE',
    capacity: '',
    address: '',
    onlineLink: '',
    departmentId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  // Type options
  const typeOptions = [
    { value: 'OFFLINE', label: 'Offline' },
    { value: 'ONLINE', label: 'Online' },
    { value: 'HYBRID', label: 'Hybrid' },
  ];

  // Department options (có search)
  const departmentOptions = [
    { value: '', label: 'Chọn đơn vị' },
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

  useEffect(() => {
    if (initialData && mode !== 'create') {
      setFormData(initialData);
    } else {
      resetForm();
    }
  }, [initialData, mode, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'OFFLINE',
      capacity: '',
      address: '',
      onlineLink: '',
      departmentId: '',
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên phòng';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Vui lòng nhập mã phòng';
    }

    if (!formData.type) {
      newErrors.type = 'Vui lòng chọn loại địa điểm';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Vui lòng chọn đơn vị';
    }

    // Validate theo type
    if (formData.type === 'OFFLINE' || formData.type === 'HYBRID') {
      if (!formData.capacity || Number(formData.capacity) <= 0) {
        newErrors.capacity = 'Vui lòng nhập sức chứa';
      }
      if (!formData.address.trim()) {
        newErrors.address = 'Vui lòng nhập địa chỉ';
      }
    }

    if (formData.type === 'ONLINE' || formData.type === 'HYBRID') {
      if (!formData.onlineLink.trim()) {
        newErrors.onlineLink = 'Vui lòng nhập link online';
      } else if (formData.onlineLink) {
        // Validate URL
        try {
          new URL(formData.onlineLink);
        } catch {
          newErrors.onlineLink = 'Link không đúng định dạng';
        }
      }
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
        return 'Thêm địa điểm họp mới';
      case 'edit':
        return 'Cập nhật địa điểm họp';
      case 'view':
        return 'Thông tin địa điểm họp';
      default:
        return '';
    }
  };

  // Check if field should be shown based on type
  const showCapacity = formData.type === 'OFFLINE' || formData.type === 'HYBRID';
  const showAddress = formData.type === 'OFFLINE' || formData.type === 'HYBRID';
  const showOnlineLink = formData.type === 'ONLINE' || formData.type === 'HYBRID';

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
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center border-4 border-white shadow-lg">
                <MapPin className="h-10 w-10 text-green-600" />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Row 1: Tên phòng | Mã phòng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Tên phòng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập tên phòng họp"
                    disabled={isViewMode}
                    className={cn(
                      'h-10 rounded-xl border-gray-300 hover:border-gray-400',
                      errors.name && 'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 font-medium">{errors.name}</p>
                  )}
                </div>

                {/* Code */}
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                    Mã phòng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Nhập mã phòng"
                    disabled={isViewMode}
                    className={cn(
                      'h-10 rounded-xl border-gray-300 hover:border-gray-400 font-mono',
                      errors.code && 'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                  {errors.code && (
                    <p className="text-xs text-red-600 font-medium">{errors.code}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Type | Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                    Loại địa điểm <span className="text-red-500">*</span>
                  </Label>
                  <CustomSelect
                    value={formData.type}
                    onChange={(value) => setFormData({ ...formData, type: value as LocationType })}
                    options={typeOptions}
                    placeholder="Chọn loại"
                    disabled={isViewMode}
                    usePortal={true}
                    className={cn(
                      errors.type && 'ring-2 ring-red-500'
                    )}
                  />
                  {errors.type && (
                    <p className="text-xs text-red-600 font-medium">{errors.type}</p>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                    Đơn vị <span className="text-red-500">*</span>
                  </Label>
                  <CustomSelect
                    value={formData.departmentId}
                    onChange={(value) => setFormData({ ...formData, departmentId: value })}
                    options={departmentOptions}
                    placeholder="Chọn đơn vị"
                    disabled={isViewMode}
                    searchable
                    searchPlaceholder="Tìm kiếm đơn vị..."
                    usePortal={true}
                    className={cn(
                      errors.departmentId && 'ring-2 ring-red-500'
                    )}
                  />
                  {errors.departmentId && (
                    <p className="text-xs text-red-600 font-medium">{errors.departmentId}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Sức chứa (conditional) */}
              {showCapacity && (
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">
                    Sức chứa (số lượng người) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Nhập sức chứa"
                    disabled={isViewMode}
                    className={cn(
                      'h-10 rounded-xl border-gray-300 hover:border-gray-400',
                      errors.capacity && 'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                  {errors.capacity && (
                    <p className="text-xs text-red-600 font-medium">{errors.capacity}</p>
                  )}
                </div>
              )}

              {/* Row 4: Địa chỉ (conditional) */}
              {showAddress && (
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Địa chỉ <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Nhập địa chỉ phòng họp"
                    disabled={isViewMode}
                    rows={3}
                    className={cn(
                      'w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white placeholder:text-gray-500',
                      'focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]',
                      'hover:border-gray-400 transition-colors resize-none',
                      isViewMode && 'bg-gray-50 cursor-not-allowed',
                      errors.address && 'border-red-500'
                    )}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600 font-medium">{errors.address}</p>
                  )}
                </div>
              )}

              {/* Row 5: Online Link (conditional) */}
              {showOnlineLink && (
                <div className="space-y-2">
                  <Label htmlFor="onlineLink" className="text-sm font-medium text-gray-700">
                    Link Online <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="onlineLink"
                    type="url"
                    value={formData.onlineLink}
                    onChange={(e) => setFormData({ ...formData, onlineLink: e.target.value })}
                    placeholder="https://..."
                    disabled={isViewMode}
                    className={cn(
                      'h-10 rounded-xl border-gray-300 hover:border-gray-400',
                      errors.onlineLink && 'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                  {errors.onlineLink && (
                    <p className="text-xs text-red-600 font-medium">{errors.onlineLink}</p>
                  )}
                </div>
              )}
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
