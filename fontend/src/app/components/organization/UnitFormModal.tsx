import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { Button } from '../ui/hp-button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { cn } from '../../../lib/utils';

type ModalMode = 'create' | 'edit' | 'view';

interface UnitFormData {
  id?: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
}

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (unit: UnitFormData) => void;
  mode: ModalMode;
  initialData?: UnitFormData;
  parentUnitName?: string;
}

export const UnitFormModal: React.FC<UnitFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  parentUnitName,
}) => {
  const [formData, setFormData] = useState<UnitFormData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

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
      address: '',
      phone: '',
      email: '',
      description: '',
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
      newErrors.name = 'Tên đơn vị là bắt buộc';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Mã đơn vị là bắt buộc';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9\s\.\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ là bắt buộc';
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
        return 'Thêm đơn vị mới';
      case 'edit':
        return 'Cập nhật đơn vị';
      case 'view':
        return 'Thông tin đơn vị';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  console.log('UnitFormModal rendering, mode:', mode, 'formData:', formData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in fade-in-0 zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#C8102E]/10">
              <Building2 className="h-5 w-5 text-[#C8102E]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getModalTitle()}</h3>
              {isCreateMode && parentUnitName && (
                <p className="text-sm text-gray-500">Đơn vị cha: {parentUnitName}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Form Fields - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Tên đơn vị <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên đơn vị"
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
                  Mã đơn vị <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Nhập mã đơn vị"
                  disabled={isViewMode}
                  className={cn(
                    'h-10 rounded-xl border-gray-300 hover:border-gray-400',
                    errors.code && 'border-red-500 focus-visible:ring-red-500'
                  )}
                />
                {errors.code && (
                  <p className="text-xs text-red-600 font-medium">{errors.code}</p>
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
            </div>

            {/* Address - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                Địa chỉ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Nhập địa chỉ"
                disabled={isViewMode}
                className={cn(
                  'h-10 rounded-xl border-gray-300 hover:border-gray-400',
                  errors.address && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
              {errors.address && (
                <p className="text-xs text-red-600 font-medium">{errors.address}</p>
              )}
            </div>

            {/* Description - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Mô tả
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả về đơn vị"
                disabled={isViewMode}
                rows={3}
                className={cn(
                  'w-full px-3 py-2 rounded-xl border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all resize-none',
                  isViewMode && 'bg-gray-50 cursor-not-allowed'
                )}
              />
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
                className="px-5 py-2 bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white hover:shadow-lg"
              >
                {isCreateMode ? 'Thêm đơn vị' : 'Cập nhật'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
