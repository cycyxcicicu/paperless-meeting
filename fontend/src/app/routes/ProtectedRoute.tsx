import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { hasRoutePermission } from './config';
import { useAuth } from '@/app/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-4 border-[#C8102E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Cho phép render trang 404 trực tiếp để tránh vòng lặp chuyển hướng vô hạn
  if (location.pathname === '/404') {
    return <>{children}</>;
  }

  const allowed = hasRoutePermission(user, location.pathname);

  if (!allowed) {
    // Nếu là trang chủ '/' vẫn cho qua phòng trường hợp chưa tải kịp role để tránh lỗi trắng màn hình
    if (location.pathname === '/') {
      return <>{children}</>;
    }
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
};
