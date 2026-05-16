import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Modal } from '@/common/components/ui/modal';
import { Button } from '@/common/components/ui/button';
import { FormInput } from '@/common/components/form/FormInput';
import { cn } from '@/common/utils/cn';

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu cũ'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ChangePasswordValues) => void;
  isFirstLogin?: boolean; // Thêm cờ này
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  isFirstLogin = false 
}) => {
  const methods = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const handleFormSubmit = (data: ChangePasswordValues) => {
    onSubmit(data);
    methods.reset();
    onClose();
  };

  const handleClose = () => {
    if (isFirstLogin) return; // Không cho phép đóng nếu là đăng nhập lần đầu
    methods.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isFirstLogin ? "Yêu cầu đổi mật khẩu lần đầu" : "Đổi mật khẩu"}
      className="sm:max-w-[450px]"
      preventClose={isFirstLogin}
    >
      <div className="pt-4">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm">
            <KeyRound className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        {isFirstLogin && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Để bảo mật tài khoản, vui lòng thay đổi mật khẩu mặc định trong lần đăng nhập đầu tiên.
            </p>
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormInput
              name="oldPassword"
              label="Mật khẩu hiện tại"
              type="password"
              required
              placeholder="Nhập mật khẩu hiện tại"
            />
            
            <div className="h-px bg-gray-100 my-2" />
            
            <FormInput
              name="newPassword"
              label="Mật khẩu mới"
              type="password"
              required
              placeholder="Nhập mật khẩu mới"
              description="Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt"
            />
            
            <FormInput
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              type="password"
              required
              placeholder="Nhập lại mật khẩu mới"
            />

            <div className="flex justify-end gap-3 pt-6">
              {!isFirstLogin && (
                <Button type="button" variant="outline" onClick={handleClose} className="rounded-xl">
                  Hủy bỏ
                </Button>
              )}
              <Button type="submit" variant="primary" className={cn("rounded-xl px-6 flex items-center gap-2", isFirstLogin && "w-full justify-center py-6")}>
                <ShieldCheck className="h-4 w-4" />
                {isFirstLogin ? "Xác nhận và bắt đầu" : "Cập nhật mật khẩu"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
};
