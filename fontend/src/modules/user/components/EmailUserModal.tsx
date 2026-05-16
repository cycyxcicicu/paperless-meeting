import React from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/ui/modal';
import { FormInput } from '@/common/components/form/FormInput';
import { useForm, FormProvider } from 'react-hook-form';

interface EmailUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { subject: string; content: string }) => void;
  count: number;
}

export const EmailUserModal: React.FC<EmailUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  count,
}) => {
  const methods = useForm({
    defaultValues: { subject: '', content: '' }
  });

  if (!isOpen) return null;

  const handleSubmit = (data: any) => {
    onSubmit(data);
    methods.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="sm:max-w-lg"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-lg btn-primary text-gray-900">
            Gửi email hàng loạt
          </span>
        </div>
      }
    >
      <div className="py-2">
        <p className="text-sm text-gray-600 mb-4">
          Chuẩn bị gửi email cho <span className="font-bold text-blue-600">{count}</span> người dùng đã chọn.
        </p>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
            <FormInput 
              name="subject" 
              label="Tiêu đề email" 
              placeholder="Nhập tiêu đề..." 
              required 
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                {...methods.register('content', { required: true })}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Nhập nội dung email..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button type="submit" variant="primary">
                Gửi email
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
};
