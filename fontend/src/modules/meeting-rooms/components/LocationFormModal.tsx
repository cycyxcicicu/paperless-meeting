import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { createMeetingRoomFormSchema } from '../form/meetingRoomForm.schema';
import { meetingRoomValidationSchema, MeetingRoomFormData } from '../form/meetingRoomForm.validation';
import { FormMode } from '@/common/components/form-engine/form.types';

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MeetingRoomFormData) => void;
  mode: 'create' | 'edit' | 'view';
  initialData?: any;
}

export const LocationFormModal: React.FC<LocationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
}) => {
  const isViewMode = mode === 'view';
  
  const methods = useForm<any>({
    resolver: zodResolver(meetingRoomValidationSchema),
    defaultValues: {
      name: '',
      code: '',
      building: '',
      floor: '',
      capacity: 0,
      status: 'active',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        methods.reset(initialData);
      } else {
        methods.reset({
          name: '',
          code: '',
          building: '',
          floor: '',
          capacity: 0,
          status: 'active',
        });
      }
    }
  }, [isOpen, initialData, methods]);

  const onFormSubmit = (data: MeetingRoomFormData) => {
    onSubmit(data);
    onClose();
  };

  const getTitle = () => {
    if (mode === 'create') return 'Thêm phòng họp mới';
    if (mode === 'edit') return 'Cập nhật phòng họp';
    return 'Chi tiết phòng họp';
  };

  const groups = createMeetingRoomFormSchema();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      className="sm:max-w-[600px]"
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onFormSubmit)} className="space-y-6 pt-4">
          <DynamicFormRenderer groups={groups} mode={mode as FormMode} />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>
              {isViewMode ? 'Đóng' : 'Hủy bỏ'}
            </Button>
            {!isViewMode && (
              <Button type="submit" variant="primary">
                {mode === 'create' ? 'Thêm mới' : 'Lưu thay đổi'}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
};
