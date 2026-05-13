import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2 } from 'lucide-react';
import { Button } from '../common/ui/Button';
import { Modal } from '../common/ui/Modal';
import { FormInput } from '../common/form/FormInput';

type ModalMode = 'create' | 'edit' | 'view';

export interface UnitFormData {
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
  /** Label describing unit type, e.g. "đơn vị", "phòng ban", "bộ phận" */
  unitTypeLabel?: string;
}

const unitSchema = z.object({
  name: z.string().min(1, 'Tên đơn vị là bắt buộc'),
  code: z.string().min(1, 'Mã đơn vị là bắt buộc'),
  phone: z.string().min(1, 'Số điện thoại là bắt buộc').regex(/^[0-9\s.\-()]+$/, 'Số điện thoại không hợp lệ'),
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  address: z.string().min(1, 'Địa chỉ là bắt buộc'),
  description: z.string().optional().default(''),
});

type UnitFormValues = z.infer<typeof unitSchema>;

export const UnitFormModal: React.FC<UnitFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  parentUnitName,
  unitTypeLabel = 'đơn vị',
}) => {
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  const methods = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      description: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode !== 'create') {
        methods.reset(initialData);
      } else {
        methods.reset({ name: '', code: '', address: '', phone: '', email: '', description: '' });
      }
    }
  }, [initialData, mode, isOpen, methods]);

  const handleClose = () => {
    methods.reset();
    onClose();
  };

  const onFormSubmit = (data: UnitFormValues) => {
    if (isViewMode) {
      handleClose();
      return;
    }
    const payload = initialData?.id ? { ...data, id: initialData.id } : data;
    onSubmit(payload as UnitFormData);
    handleClose();
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return `Thêm ${unitTypeLabel} mới`;
      case 'edit': return `Cập nhật ${unitTypeLabel}`;
      case 'view': return `Thông tin ${unitTypeLabel}`;
      default: return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-lg font-semibold text-gray-900">{getModalTitle()}</span>
            {isCreateMode && parentUnitName && (
              <p className="text-sm font-normal text-gray-500 mt-0.5">Đơn vị cha: {parentUnitName}</p>
            )}
          </div>
        </div>
      }
      className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onFormSubmit)} className="space-y-5 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput name="name" label={`Tên ${unitTypeLabel}`} required disabled={isViewMode} />
            <FormInput name="code" label={`Mã ${unitTypeLabel}`} required disabled={isViewMode} className="font-mono" />
            <FormInput name="phone" label="Số điện thoại" type="tel" required disabled={isViewMode} />
            <FormInput name="email" label="Email" type="email" required disabled={isViewMode} />
          </div>

          <FormInput name="address" label="Địa chỉ" required disabled={isViewMode} />

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">Mô tả</label>
            <textarea
              id="description"
              {...methods.register('description')}
              disabled={isViewMode}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-400 transition-colors resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="Nhập mô tả về đơn vị"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={handleClose}>
              {isViewMode ? 'Đóng' : 'Hủy bỏ'}
            </Button>
            {!isViewMode && (
              <Button type="submit" variant="primary">
                {isCreateMode ? `Thêm ${unitTypeLabel}` : 'Cập nhật'}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
};
