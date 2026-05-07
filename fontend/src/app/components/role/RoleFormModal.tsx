import React, { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { Button } from '../ui/hp-button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { cn } from '../../../lib/utils';

type ModalMode = 'create' | 'edit' | 'view';

interface RoleFormData {
  id?: number;
  name: string;
  code: string;
  description: string;
}

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (role: RoleFormData) => void;
  mode: ModalMode;
  initialData?: RoleFormData;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
}) => {
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    code: '',
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
      newErrors.name = 'Vui lòng nhập tên vai trò';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Vui lòng nhập mã vai trò';
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
        return 'Thêm vai trò mới';
      case 'edit':
        return 'Cập nhật vai trò';
      case 'view':
        return 'Thông tin vai trò';
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in fade-in-0 zoom-in-95 max-h-[90vh] flex flex-col">
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Role Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Tên vai trò <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên vai trò"
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

              {/* Role Code */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                  Mã vai trò <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Nhập mã vai trò"
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Mô tả
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả vai trò"
                  disabled={isViewMode}
                  rows={4}
                  className={cn(
                    'w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white placeholder:text-gray-500',
                    'focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]',
                    'hover:border-gray-400 transition-colors resize-none',
                    isViewMode && 'bg-gray-50 cursor-not-allowed'
                  )}
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
