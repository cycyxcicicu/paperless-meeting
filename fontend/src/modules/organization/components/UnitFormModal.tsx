import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import { Modal } from '@/common/components/ui/modal';
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { unitFormSchema } from '../form/unitForm.schema';
import { getUnitValidationSchema, UnitFormValues } from '../form/unitForm.validation';
import { unitFormMapper } from '../form/unitForm.mapper';
import { FormMode } from '@/common/components/form-engine/form.types';
import { departmentApi } from '../services/department.api';

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
    resolver: zodResolver(getUnitValidationSchema(unitTypeLabel)),
    defaultValues: unitFormMapper.fromApiToForm(initialData),
    mode: 'onSubmit',
  });

  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (mode !== 'create' && initialData?.id) {
        setIsLoading(true);
        const fetchUnitDetails = async () => {
          try {
            const res = await departmentApi.getById(initialData.id!);
            if (res.success && res.data) {
              // Convert generic entity into form structure
              const apiDataAsFormInput = {
                id: res.data.id,
                name: res.data.deptName,
                code: res.data.code,
                address: res.data.headquartersAddress || "",
                phone: res.data.phoneNumber || "",
                email: res.data.email || "",
                foundedDate: res.data.establishedDate || "",
                status: res.data.status === 'ACTIVE' ? 'active' as const : 'inactive' as const,
                description: res.data.description || ""
              };
              methods.reset(unitFormMapper.fromApiToForm(apiDataAsFormInput));
            } else {
              methods.reset(unitFormMapper.fromApiToForm(initialData));
            }
          } catch (e) {
            methods.reset(unitFormMapper.fromApiToForm(initialData));
          } finally {
            setIsLoading(false);
          }
        };
        fetchUnitDetails();
      } else {
        methods.reset(unitFormMapper.fromApiToForm(initialData));
        setIsLoading(false);
      }
    } else {
      methods.clearErrors();
    }
  }, [initialData, mode, isOpen, methods]);

  const handleClose = () => {
    methods.reset();
    methods.clearErrors();
    onClose();
  };

  const onFormSubmit = async (data: UnitFormValues) => {
    if (isViewMode) {
      handleClose();
      return;
    }
    const payload = unitFormMapper.fromFormToApi(data, initialData?.id);
    try {
      await onSubmit(payload);
      handleClose();
    } catch (e) {
      // If parent throws, keep modal open.
    }
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
      preventAutoFocus={true}
    >
      <FormProvider {...methods}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-[#C8102E]"></div>
            <p className="text-gray-500 font-medium heading text-sm animate-pulse">Đang nạp dữ liệu...</p>
          </div>
        ) : (
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white heading text-sm hover:shadow-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  {isCreateMode ? `Thêm ${unitTypeLabel}` : 'Lưu cập nhật'}
                </button>
              )}
            </div>
          </form>
        )}
      </FormProvider>
    </Modal>
  );
};

