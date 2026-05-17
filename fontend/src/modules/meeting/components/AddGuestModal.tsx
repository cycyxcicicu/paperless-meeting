import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { X } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { FormFieldGroup } from '@/common/components/form-engine/form.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { guestValidationSchema } from '../form/meeting.validation';

export interface GuestData {
  id?: string;
  name: string;
  email: string;
  unit: string;
  position: string;
  gender: string;
  phone?: string;
  description?: string;
}

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (guest: GuestData) => void;
  initialData?: GuestData | null;
}

const guestFormGroups: FormFieldGroup[] = [
  {
    id: 'guest-info',
    className: 'grid-cols-2 gap-4',
    fields: [
      {
        key: 'name',
        type: 'text',
        label: 'Họ và tên',
        required: true,
        col: 'col-span-1',
      },
      {
        key: 'gender',
        type: 'select',
        label: 'Giới tính',
        required: true,
        col: 'col-span-1',
        options: [
          { value: 'Nam', label: 'Nam' },
          { value: 'Nữ', label: 'Nữ' },
          { value: 'Khác', label: 'Khác' },
        ],
      },
      {
        key: 'email',
        type: 'text',
        label: 'Email',
        required: true,
        email: true,
        col: 'col-span-1',
      },
      {
        key: 'phone',
        type: 'text',
        label: 'Số điện thoại',
        required: false,
        col: 'col-span-1',
      },
      {
        key: 'unit',
        type: 'text',
        label: 'Đơn vị công tác',
        required: true,
        col: 'col-span-1',
      },
      {
        key: 'position',
        type: 'text',
        label: 'Chức vụ',
        required: true,
        col: 'col-span-1',
      },
      {
        key: 'description',
        type: 'textarea',
        label: 'Mô tả',
        required: false,
        col: 'col-span-2',
        rows: 3,
      },
    ],
  },
];

const AddGuestModal: React.FC<AddGuestModalProps> = ({ isOpen, onClose, onConfirm, initialData }) => {
  const methods = useForm<GuestData>({
    resolver: zodResolver(guestValidationSchema),
    defaultValues: {
      name: '',
      email: '',
      unit: '',
      position: '',
      gender: '',
      phone: '',
      description: '',
    },
    mode: 'onSubmit',
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        methods.reset(initialData);
      } else {
        methods.reset({
          name: '',
          email: '',
          unit: '',
          position: '',
          gender: '',
          phone: '',
          description: '',
        });
      }
    }
  }, [isOpen, initialData, methods]);

  if (!isOpen) return null;

  const handleSubmit = (data: GuestData) => {
    onConfirm({ ...data, id: initialData?.id || `guest-${Date.now()}` });
    methods.reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg btn-primary text-gray-900">
            {initialData ? 'Cập nhật khách mời' : 'Thêm khách mời'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <FormProvider {...methods}>
            <form id="guest-form" onSubmit={methods.handleSubmit(handleSubmit)}>
              <DynamicFormRenderer groups={guestFormGroups} mode="create" />
            </form>
          </FormProvider>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" form="guest-form">
            {initialData ? 'Lưu thay đổi' : 'Lưu khách mời'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { AddGuestModal };
