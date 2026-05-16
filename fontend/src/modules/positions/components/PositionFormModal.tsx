import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { positionFormSchema } from '../form/positionForm.schema';
import { positionFormValidationSchema } from '../form/positionForm.validation';
import { FormMode } from '@/common/components/form-engine/form.types';

type ModalMode = 'create' | 'edit' | 'view';

export interface PositionFormData {
  id?: string;
  name: string;
  code: string;
  description: string;
}

interface PositionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (position: PositionFormData) => void;
  mode: ModalMode;
  initialData?: PositionFormData;
}

export const PositionFormModal: React.FC<PositionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
}) => {
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  const methods = useForm<any>({
    resolver: zodResolver(positionFormValidationSchema),
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

  const onFormSubmit = (data: PositionFormData) => {
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
        <form onSubmit={methods.handleSubmit(onFormSubmit as any)} className="space-y-6 pt-4" noValidate>
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center border border-purple-200/50 shadow-sm group">
              <Briefcase className="h-10 w-10 text-purple-600 transition-transform group-hover:scale-110" />
            </div>
          </div>

          <div className="px-1">
            <DynamicFormRenderer 
              groups={[{ id: 'main', fields: positionFormSchema }]} 
              mode={mode as FormMode} 
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={handleClose} className="rounded-xl">
              {isViewMode ? 'Đóng' : 'Hủy bỏ'}
            </Button>
            {!isViewMode && (
              <Button type="submit" variant="primary" className="rounded-xl px-6">
                {isCreateMode ? 'Thêm mới' : 'Lưu thay đổi'}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
};

