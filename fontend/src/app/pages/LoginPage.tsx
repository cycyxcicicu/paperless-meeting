import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/common/components/ui/button';
import { FormInput } from '@/common/components/form/FormInput';
import { ImageWithFallback } from '@/common/components/ui/ImageWithFallback';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/context/AuthContext';
import { api } from '@/lib/api/axios';
import { toast } from 'sonner';

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    }
  });

  const handleLogin = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      await api.post('/auth/login', data);

      // Fetch user profile immediately
      await fetchUser();

      navigate('/');
    } catch (err: any) {
      console.error(err);
      let errMsg = err?.response?.data?.message;
      if (!errMsg || errMsg === 'Bad credentials' || err?.response?.status === 401) {
        errMsg = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
      }
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
      <div className="w-full max-w-[1200px] bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
          {/* Cột trái - Hình ảnh với overlay */}
          <div className="relative hidden lg:block">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1774600134168-b9ebd714e4e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb25mZXJlbmNlJTIwcm9vbSUyMGJ1c2luZXNzJTIwbWVldGluZ3xlbnwxfHx8fDE3NzQ5ODU3MTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Phòng họp UBND Hải Phòng"
              className="w-full h-full object-cover"
            />
            {/* Overlay đỏ nhẹ */}
            <div className="absolute inset-0 bg-[#C8102E] bg-opacity-[0.08]"></div>

            {/* Nội dung trên overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
              <div className="bg-[#C8102E] bg-opacity-90 rounded-xl p-8">
                <h2 className="text-2xl btn-primary mb-3">
                  Hệ thống quản lý phòng họp không giấy
                </h2>
                <p className="text-sm opacity-95 leading-relaxed">
                  Giải pháp số hóa quản lý phiên họp, tài liệu và biểu quyết
                  cho Ủy ban nhân dân thành phố Hải Phòng. Bảo mật cao,
                  hiệu quả và chính thống.
                </p>
              </div>
            </div>
          </div>

          {/* Cột phải - Form đăng nhập */}
          <div className="flex flex-col justify-center px-8 lg:px-16 py-12">
            {/* Logo và tiêu đề */}
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C8102E] rounded-xl mb-6">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 4L6 13V22C6 32.5 13.84 42.24 24 44C34.16 42.24 42 32.5 42 22V13L24 4Z" fill="white" fillOpacity="0.95" />
                  <path d="M24 12L14 17V24C14 30.5 18.42 36.62 24 38C29.58 36.62 34 30.5 34 24V17L24 12Z" fill="#C8102E" />
                </svg>
              </div>
              <h1 className="text-[#111827] mb-2 uppercase tracking-tight">
                Ủy ban nhân dân
              </h1>
              <h1 className="text-[#111827] mb-2 uppercase tracking-tight">
                Thành phố Hải Phòng
              </h1>
              <p className="text-[#6B7280] text-sm mt-3">
                Hệ thống quản lý phòng họp không giấy
              </p>
            </div>

            {/* Form đăng nhập (Refactored to RHF) */}
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(handleLogin)} className="space-y-6">
                <FormInput
                  name="username"
                  label="Tên đăng nhập"
                  placeholder="Nhập tên đăng nhập"
                  className="[&>input]:h-11 [&>input]:rounded-xl"
                  required
                />

                <FormInput
                  name="password"
                  label="Mật khẩu"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  className="[&>input]:h-11 [&>input]:rounded-xl"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full h-12 !mt-10"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </form>
            </FormProvider>

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-[#E5E7EB]">
              <div className="text-center space-y-2">
                <p className="text-xs text-[#6B7280]">
                  Văn phòng UBND thành phố Hải Phòng
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  Hỗ trợ kỹ thuật: <a href="tel:0225-3842-555" className="text-[#C8102E] hover:underline">0225.3842.555</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
