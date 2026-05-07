import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Sidebar, SidebarItem } from '../components/layout/Sidebar';
import { EmptyState } from '../components/ui/hp-empty-state';
import { Settings } from 'lucide-react';

const sidebarItems: SidebarItem[] = [
  { name: 'Người dùng', path: '/quan-tri' },
  { name: 'Phòng họp', path: '/quan-tri/phong-hop' },
  { name: 'Cấu hình', path: '/quan-tri/cau-hinh' },
  { name: 'Nhật ký hệ thống', path: '/quan-tri/nhat-ky' },
];

const QuanTriPage = () => {
  return (
    <div className="flex">
      <Sidebar title="Quản trị hệ thống" items={sidebarItems} />
      
      <main className="flex-1 ml-60 p-8">
        <PageHeader
          title="Quản trị hệ thống"
          description="Quản lý người dùng, phân quyền và cấu hình hệ thống"
          breadcrumbs={[
            { name: 'Trang chủ', path: '/' },
            { name: 'Quản trị hệ thống' },
          ]}
        />
        
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          <EmptyState
            icon={<Settings className="h-8 w-8 text-[#9CA3AF]" />}
            title="Chức năng đang phát triển"
            description="Tính năng quản trị hệ thống đang được hoàn thiện"
          />
        </div>
      </main>
    </div>
  );
};

export default QuanTriPage;
