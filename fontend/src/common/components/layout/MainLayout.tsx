import React from 'react';
import { Outlet, useLocation } from 'react-router';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import {
    PHIEN_HOP_SIDEBAR_ITEMS,
    QUAN_TRI_SIDEBAR_ITEMS,
    PHONG_HOP_SIDEBAR_ITEMS
} from '@/app/constants/sidebar';
import { ROUTE_PERMISSIONS } from '@/app/routes/config';

const MainLayout: React.FC = () => {
    const location = useLocation();
    const pathname = location.pathname;

    // Lấy quyền từ localStorage (tương tự ProtectedRoute)
    const userRole = localStorage.getItem('userRole') || 'ADMIN';
    const allowedPaths = ROUTE_PERMISSIONS[userRole] || [];

    // Hàm kiểm tra xem path có được phép không
    const hasPermission = (path: string) => {
        return allowedPaths.some(allowed => {
            if (allowed.endsWith('/*')) {
                const basePath = allowed.slice(0, -2);
                return path.startsWith(basePath);
            }
            return path === allowed;
        });
    };

    // Xác định sidebar items dựa trên route
    let sidebarItems = PHIEN_HOP_SIDEBAR_ITEMS; // Mặc định

    if (pathname.startsWith('/nguoi-dung') || pathname.startsWith('/cau-hinh')) {
        sidebarItems = QUAN_TRI_SIDEBAR_ITEMS;
    } else if (pathname.startsWith('/phong-hop')) {
        sidebarItems = PHONG_HOP_SIDEBAR_ITEMS;
    } else if (pathname.startsWith('/phien-hop')) {
        sidebarItems = PHIEN_HOP_SIDEBAR_ITEMS;
    }

    // Lọc bỏ những item không có quyền truy cập
    const filteredSidebarItems = sidebarItems.filter(item => hasPermission(item.path)).map(item => {
        // Lọc cả subItems nếu có
        if (item.subItems) {
            return {
                ...item,
                subItems: item.subItems.filter(sub => hasPermission(sub.path))
            };
        }
        return item;
    });

    // Một số trang đặc biệt không hiện sidebar nếu cần (ví dụ HomePage)
    const showSidebar = pathname !== '/';

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <TopBar />
            <div className="flex pt-16">
                {showSidebar && (
                    <div className="fixed left-0 top-16 bottom-0 w-64 z-20">
                        <Sidebar items={filteredSidebarItems} />
                    </div>
                )}
                <main className={`flex-1 transition-all duration-300 ${showSidebar ? 'ml-64' : ''}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export { MainLayout };