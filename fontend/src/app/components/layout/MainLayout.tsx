import React from 'react';
import { Outlet, useLocation } from 'react-router';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import {
    PHIEN_HOP_SIDEBAR_ITEMS,
    QUAN_TRI_SIDEBAR_ITEMS,
    PHONG_HOP_SIDEBAR_ITEMS
} from '../../constants/sidebar';

const MainLayout: React.FC = () => {
    const location = useLocation();
    const pathname = location.pathname;

    // Xác định sidebar items dựa trên route
    let sidebarItems = PHIEN_HOP_SIDEBAR_ITEMS; // Mặc định

    if (pathname.startsWith('/nguoi-dung') || pathname.startsWith('/cau-hinh')) {
        sidebarItems = QUAN_TRI_SIDEBAR_ITEMS;
    } else if (pathname.startsWith('/phong-hop')) {
        // Nếu là tài liệu mà đi từ phien-hop thì đã có route riêng hoặc dùng logic này
        if (pathname.startsWith('/phong-hop')) {
            sidebarItems = PHONG_HOP_SIDEBAR_ITEMS;
        }
    } else if (pathname.startsWith('/phien-hop')) {
        sidebarItems = PHIEN_HOP_SIDEBAR_ITEMS;
    }

    // Một số trang đặc biệt không hiện sidebar nếu cần (ví dụ HomePage)
    const showSidebar = pathname !== '/';

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <TopBar />
            <div className="flex pt-16">
                {showSidebar && (
                    <div className="fixed left-0 top-16 bottom-0 w-64 z-20">
                        <Sidebar items={sidebarItems} />
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