import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api/axios';
import { ChangePasswordModal } from '@/modules/user/components/ChangePasswordModal';
import { toast } from 'sonner';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  avatar: string;
  isFirstLogin: boolean;
  department?: any;
  role?: any;
  position?: any;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  forceShowChangePassword: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response && response.data) {
        setUser(response.data);
        localStorage.setItem('paperless_logged_in', 'true');
        if (response.data.isFirstLogin) {
          setShowFirstLoginModal(true);
        } else {
          setShowFirstLoginModal(false);
        }
      }
    } catch (err: any) {
      // Chỉ log rác lỗi ra khi lỗi không phải do 401 (Hết hạn/Chưa login) hoặc 400 (Lỗi Refresh token trắng)
      const status = err?.response?.status;
      if (status !== 401 && status !== 400 && status !== 403) {
        console.error('Không thể lấy thông tin người dùng', err);
      }
      setUser(null);
      localStorage.removeItem('paperless_logged_in'); // Xóa cờ nếu lấy user lỗi (hết hạn session)
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Đăng xuất thất bại', err);
    } finally {
      setUser(null);
      localStorage.removeItem('paperless_logged_in'); // Giải phóng cờ khi logout
      window.location.href = '/login';
    }
  };

  const forceShowChangePassword = () => {
    setShowFirstLoginModal(true);
  };

  useEffect(() => {
    // Tối ưu hóa: Chỉ thực hiện gọi /auth/me nếu localStorage ghi nhận trước đó đã đăng nhập
    // Để tránh in 3 dòng lỗi đỏ lòm (401 & 400) trên Chrome console vô ích khi người dùng chưa login.
    const isAlreadyLoggedIn = localStorage.getItem('paperless_logged_in') === 'true';
    if (isAlreadyLoggedIn) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleForceChangePassword = () => {
      forceShowChangePassword();
    };

    window.addEventListener('auth:force-change-password', handleForceChangePassword);

    return () => {
      window.removeEventListener('auth:force-change-password', handleForceChangePassword);
    };
  }, []);

  const handleChangePasswordSubmit = async (data: any) => {
    try {
      await api.post('/auth/change-password', data);

      // Thành công => Cập nhật lại user context và tắt modal
      await fetchUser(); // Gọi lại /me để update state, isFirstLogin sẽ thành false từ API
      setShowFirstLoginModal(false);
      toast.success('Đổi mật khẩu thành công!');
    } catch (error: any) {
      console.error('Đổi mật khẩu thất bại', error);
      toast.error(error?.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, fetchUser, forceShowChangePassword, logout }}>
      {children}

      {/* Global Change Password Modal, rendered outside typical routes */}
      {showFirstLoginModal && (
        <ChangePasswordModal
          isOpen={true}
          isFirstLogin={true}
          onClose={() => { }} // Won't close anyway because isFirstLogin=true prevents it
          onSubmit={handleChangePasswordSubmit}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
