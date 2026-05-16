import React, { useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { Checkbox } from '@/common/components/ui/checkbox';
import { ImageWithFallback } from '@/common/components/ui/ImageWithFallback';
import { useNavigate } from 'react-router';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - chuyển đến trang chủ
    navigate('/');
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
                  <path d="M24 4L6 13V22C6 32.5 13.84 42.24 24 44C34.16 42.24 42 32.5 42 22V13L24 4Z" fill="white" fillOpacity="0.95"/>
                  <path d="M24 12L14 17V24C14 30.5 18.42 36.62 24 38C29.58 36.62 34 30.5 34 24V17L24 12Z" fill="#C8102E"/>
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

            {/* Form đăng nhập */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm body text-[#111827]">
                  Tên đăng nhập
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11 rounded-xl border-[#E5E7EB] focus:border-[#C8102E]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm body text-[#111827]">
                  Mật khẩu
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl border-[#E5E7EB] focus:border-[#C8102E]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-[#6B7280] cursor-pointer select-none"
                  >
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <a href="#" className="text-sm text-[#C8102E] hover:underline">
                  Quên mật khẩu?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-12"
              >
                Đăng nhập
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E7EB]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 text-[#9CA3AF]">hoặc</span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full h-12"
                onClick={() => {}}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <path d="M7 7h10M7 12h10M7 17h7"/>
                </svg>
                Đăng nhập bằng mã QR
              </Button>
            </form>

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
