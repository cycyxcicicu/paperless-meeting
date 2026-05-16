import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { ROUTE_PERMISSIONS } from './config';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // Lấy role từ localStorage (thực tế có thể từ Context/Redux)
  // Mặc định ADMIN để dễ test, bạn có thể đổi thành USER/MANAGER trong localStorage
  const userRole = localStorage.getItem('userRole') || 'ADMIN';
  
  const allowedPaths = ROUTE_PERMISSIONS[userRole] || [];
  
  const hasPermission = allowedPaths.some(path => {
    if (path.endsWith('/*')) {
      const basePath = path.slice(0, -2);
      return location.pathname.startsWith(basePath);
    }
    return path === location.pathname;
  });

  if (!hasPermission) {
    // Chuyển hướng về trang chủ nếu không có quyền
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
