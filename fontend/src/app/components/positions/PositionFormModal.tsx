import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Briefcase } from 'lucide-react';
import { Button } from '../common/ui/Button';
import { Modal } from '../common/ui/Modal';
import { FormInput } from '../common/form/FormInput';

type ModalMode = 'create' | 'edit' | 'view';

export interface PositionFormData {
  id?: string;
  name: string;
  description: string;
}

interface PositionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (position: PositionFormData) => void;
  mode: ModalMode;
  initialData?: PositionFormData;
}

const positionSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên chức vụ'),
  description: z.string().optional().default(''),
});

type PositionFormValues = z.infer<typeof positionSchema>;

export const PositionFormModal: React.FC<PositionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
}) => {
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  const methods = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode !== 'create') {
        methods.reset(initialData);
      } else {
        methods.reset({ name: '', description: '' });
      }
    }
  }, [initialData, mode, isOpen, methods]);

  const handleClose = () => {
    methods.reset();
    onClose();
  };

  const onFormSubmit = (data: PositionFormValues) => {
    if (isViewMode) {
      handleClose();
      return;
    }
    const payload = initialData?.id ? { ...data, id: initialData.id } : data;
    onSubmit(payload as PositionFormData);
    handleClose();
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Thêm chức vụ mới';
      case 'edit': return 'Cập nhật chức vụ';
      case 'view': return 'Thông tin chức vụ';
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
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center border-4 border-white shadow-lg">
              <Briefcase className="h-10 w-10 text-purple-600" />
            </div>
          </div>

          <div className="space-y-4">
            <FormInput name="name" label="Tên chức vụ" required disabled={isViewMode} />
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                id="description"
                {...methods.register('description')}
                disabled={isViewMode}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-400 transition-colors resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Nhập mô tả chức vụ"
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
