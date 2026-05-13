import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield } from 'lucide-react';
import { Button } from '../common/ui/Button';
import { Modal } from '../common/ui/Modal';
import { FormInput } from '../common/form/FormInput';

type ModalMode = 'create' | 'edit' | 'view';

export interface RoleFormData {
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

const roleSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên vai trò'),
  code: z.string().min(1, 'Vui lòng nhập mã vai trò'),
  description: z.string().optional().default(''),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
}) => {
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  const methods = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode !== 'create') {
        methods.reset(initialData);
      } else {
        methods.reset({ name: '', code: '', description: '' });
      }
    }
  }, [initialData, mode, isOpen, methods]);

  const handleClose = () => {
    methods.reset();
    onClose();
  };

  const onFormSubmit = (data: RoleFormValues) => {
    if (isViewMode) {
      handleClose();
      return;
    }
    const payload = initialData?.id ? { ...data, id: initialData.id } : data;
    onSubmit(payload as RoleFormData);
    handleClose();
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Thêm vai trò mới';
      case 'edit': return 'Cập nhật vai trò';
      case 'view': return 'Thông tin vai trò';
      default: return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onFormSubmit)} className="space-y-6 pt-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
              <Shield className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="space-y-4">
            <FormInput name="name" label="Tên vai trò" required disabled={isViewMode} />
            <FormInput name="code" label="Mã vai trò" required disabled={isViewMode} className="font-mono" />
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                id="description"
                {...methods.register('description')}
                disabled={isViewMode}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-400 transition-colors resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Nhập mô tả vai trò"
              />
            </div>
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
