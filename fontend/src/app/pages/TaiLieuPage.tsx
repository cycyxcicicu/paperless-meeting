import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Sidebar, SidebarItem } from '../components/layout/Sidebar';
import { EmptyState } from '../components/ui/hp-empty-state';
import { FileText } from 'lucide-react';

const sidebarItems: SidebarItem[] = [
  { name: 'Tất cả tài liệu', path: '/tai-lieu' },
  { name: 'Nghị quyết', path: '/tai-lieu/nghi-quyet' },
  { name: 'Báo cáo', path: '/tai-lieu/bao-cao' },
  { name: 'Tờ trình', path: '/tai-lieu/to-trinh' },
];

const TaiLieuPage = () => {
  return (
    <div className="flex">
      <Sidebar title="Tài liệu" items={sidebarItems} />
      
      <main className="flex-1 ml-60 p-8">
        <PageHeader
          title="Quản lý tài liệu"
          description="Quản lý và tra cứu tài liệu phục vụ họp"
          breadcrumbs={[
            { name: 'Trang chủ', path: '/' },
            { name: 'Tài liệu' },
          ]}
        />
        
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          <EmptyState
            icon={<FileText className="h-8 w-8 text-[#9CA3AF]" />}
            title="Chức năng đang phát triển"
            description="Tính năng quản lý tài liệu đang được hoàn thiện"
          />
        </div>
      </main>
    </div>
  );
};

export default TaiLieuPage;
