import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';
import { permissionApi } from '../services/permission.api';

// Form Engine
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { FormMode } from '@/common/components/form-engine/form.types';
import { createRoleFormSchema } from '../form/roleForm.schema';
import { roleFormValidationSchema } from '../form/roleForm.validation';
import { mapRoleInitialData, mapRoleSubmitPayload } from '../form/roleForm.mapper';

type ModalMode = 'create' | 'edit' | 'view';

export interface RoleFormData {
  id?: string;
  roleName: string;
  roleCode: string;
  permCodes?: string[];
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
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';
  
  const [permissionOptions, setPermissionOptions] = useState<{value: string, label: string}[]>([]);

  const methods = useForm<any>({
    resolver: zodResolver(roleFormValidationSchema),
    mode: 'all',
    shouldUnregister: true,
    defaultValues: mapRoleInitialData(null),
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode !== 'create') {
        methods.reset(mapRoleInitialData(initialData));
        methods.clearErrors();
      } else {
        methods.reset(mapRoleInitialData(null));
        methods.clearErrors();
      }
      
      // Load dynamically from backend when modal opens
      const fetchOptions = async () => {
        try {
          const res = await permissionApi.getPermissions();
          if (res.success && res.data) {
             setPermissionOptions(res.data.map(p => ({
               value: p.permCode,
               label: p.description || p.permCode
             })));
          }
        } catch (e) {
          // fallback
        }
      };
      
      if (permissionOptions.length === 0) {
        fetchOptions();
      }
    }
  }, [initialData, mode, isOpen, methods]);

  const handleClose = () => {
    methods.reset();
    onClose();
  };

  const onFormSubmit = (data: any) => {
    if (isViewMode) {
      handleClose();
      return;
    }
    const normalized = mapRoleSubmitPayload(data);
    const payload = initialData?.id ? { ...normalized, id: initialData.id } : normalized;
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

  const groups = createRoleFormSchema({ permissionOptions });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onFormSubmit)} className="space-y-6 pt-4" autoComplete="off" noValidate>
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
              <Shield className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          {/* Form Engine Layout */}
          <DynamicFormRenderer groups={groups} mode={mode as FormMode} />

          {/* Footer Actions */}
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
