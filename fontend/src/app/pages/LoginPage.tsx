import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/common/components/ui/button';
import { FormInput } from '@/common/components/form/FormInput';
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
    <div 
      className="min-h-screen flex items-center justify-center p-8 bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/bg-login.png?v=2')" }}
    >
      <div className="w-full max-w-[480px] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden border-t border-l border-white/40 border-b border-r border-white/15 bg-white/30 p-8 lg:p-12 text-slate-900">
        {/* Logo và tiêu đề */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/Logo_thành_phố_Hải_Phòng.png" 
              alt="Logo Hải Phòng" 
              className="w-24 h-24 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-xl font-extrabold text-[#002C6C] uppercase tracking-tight" style={{ textShadow: '0 1px 1px rgba(255,255,255,0.6)' }}>
            Ủy ban nhân dân
          </h1>
          <h1 className="text-xl font-extrabold text-[#002C6C] uppercase tracking-tight" style={{ textShadow: '0 1px 1px rgba(255,255,255,0.6)' }}>
            Thành phố Hải Phòng
          </h1>
          <p className="text-slate-700 text-xs font-bold mt-3 tracking-wider uppercase">
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
              className="[&>input]:h-11 [&>input]:rounded-xl [&>input]:bg-white [&>input]:border-gray-300 [&>input]:text-gray-900 [&>input]:placeholder:text-gray-400 [&>label]:text-slate-800 [&>label]:font-bold"
              required
            />

            <FormInput
              name="password"
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu"
              className="[&>input]:h-11 [&>input]:rounded-xl [&>input]:bg-white [&>input]:border-gray-300 [&>input]:text-gray-900 [&>input]:placeholder:text-gray-400 [&>label]:text-slate-800 [&>label]:font-bold"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-12 !mt-10 bg-[#C8102E] hover:bg-[#a80d26] text-white border-none shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </FormProvider>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-slate-300/40">
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-700 font-bold">
              Văn phòng UBND thành phố Hải Phòng
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
