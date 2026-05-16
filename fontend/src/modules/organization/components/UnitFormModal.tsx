import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import { Modal } from '@/common/components/ui/modal';
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { unitFormSchema } from '../form/unitForm.schema';
import { unitValidationSchema, UnitFormValues } from '../form/unitForm.validation';
import { unitFormMapper } from '../form/unitForm.mapper';
import { FormMode } from '@/common/components/form-engine/form.types';

type ModalMode = 'create' | 'edit' | 'view';

export interface UnitFormData {
  id?: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  foundedDate: string;
  status: 'active' | 'inactive';
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

  const methods = useForm<any>({
    resolver: zodResolver(unitValidationSchema),
    defaultValues: unitFormMapper.fromApiToForm(initialData),
    mode: 'onSubmit',
  });

  React.useEffect(() => {
    if (isOpen) {
      methods.reset(unitFormMapper.fromApiToForm(initialData));
    } else {
      methods.clearErrors();
    }
  }, [initialData, mode, isOpen, methods]);

  const handleClose = () => {
    methods.reset();
    methods.clearErrors();
    onClose();
  };

  const onFormSubmit = (data: UnitFormValues) => {
    if (isViewMode) {
      handleClose();
      return;
    }
    const payload = unitFormMapper.fromFormToApi(data, initialData?.id);
    onSubmit(payload);
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

  // Adjust schema labels based on unitTypeLabel if needed
  const dynamicSchema = unitFormSchema.map(field => {
    if (field.key === 'name') return { ...field, label: `Tên ${unitTypeLabel}` };
    if (field.key === 'code') return { ...field, label: `Mã ${unitTypeLabel}` };
    if (field.key === 'description') return { ...field, placeholder: `Nhập mô tả về ${unitTypeLabel}` };
    return field;
  });

  const groups = [
    {
      id: 'main',
      fields: dynamicSchema,
      className: 'grid-cols-1 md:grid-cols-2 gap-5',
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50">
            <Building2 className="h-5 w-5 text-[#C8102E]" />
          </div>
          <div>
            <span className="text-lg btn-primary text-gray-900">{getModalTitle()}</span>
            {isCreateMode && parentUnitName && (
              <p className="text-sm caption text-gray-500 mt-0.5">Đơn vị cha: {parentUnitName}</p>
            )}
          </div>
        </div>
      }
      className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onFormSubmit as any)} className="space-y-6 pt-4" autoComplete="off" noValidate>
          <DynamicFormRenderer groups={groups} mode={mode as FormMode} />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 heading text-sm hover:bg-gray-50 transition-colors"
            >
              {isViewMode ? 'Đóng' : 'Hủy bỏ'}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white heading text-sm hover:shadow-lg transition-all shadow-md active:scale-95"
              >
                {isCreateMode ? `Thêm ${unitTypeLabel}` : 'Cập nhật'}
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
};

