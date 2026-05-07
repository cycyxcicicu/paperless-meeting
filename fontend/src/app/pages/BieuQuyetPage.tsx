import React, { useState } from 'react';
import { Sidebar, SidebarItem } from '../components/layout/Sidebar';
import { ModernPageHeader } from '../components/modern/ModernPageHeader';
import { ModernCard } from '../components/modern/ModernCard';
import { ModernButton } from '../components/modern/ModernButton';
import { ModernSearchBar } from '../components/modern/ModernSearchBar';
import { ModernTable, ModernColumn } from '../components/modern/ModernTable';
import { ModernBadge } from '../components/modern/ModernBadge';
import { ModernPagination } from '../components/modern/ModernPagination';
import { ModernTabs } from '../components/modern/ModernTabs';
import { Filter, RefreshCw, Upload, Eye, Home } from 'lucide-react';

const sidebarItems: SidebarItem[] = [
  { name: 'Quản lý phiếu lấy ý kiến', path: '/bieu-quyet' },
];

type TabType = 'unanswered' | 'answered' | 'expired';

interface Vote {
  id: number;
  name: string;
  assignee: string;
  deadline: string;
  status: string;
}

const BieuQuyetPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('unanswered');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mock data for expired votes tab
  const expiredVotes: Vote[] = [
    {
      id: 1,
      name: 'Phiếu lấy ý kiến về việc triển khai hệ thống',
      assignee: 'Thư ký 02',
      deadline: '06/04/2026 09:24',
      status: 'Đã hết hạn',
    },
    {
      id: 2,
      name: 'Phiếu số 2 về việc tạo dụng chuyên đề vé xác công việc',
      assignee: 'Thư ký 02',
      deadline: '11/04/2026 16:52',
      status: 'Đã hết hạn',
    },
  ];

  const tabs = [
    { key: 'unanswered' as TabType, label: 'Phiếu chưa trả lời' },
    { key: 'answered' as TabType, label: 'Phiếu đã trả lời' },
    { key: 'expired' as TabType, label: 'Phiếu đã hết hạn' },
  ];

  const getCurrentData = () => {
    if (activeTab === 'expired') return expiredVotes;
    return [];
  };

  const currentData = getCurrentData();
  const totalItems = currentData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const tableColumns: ModernColumn<Vote>[] = [
    {
      key: 'stt',
      header: 'STT',
      width: '80px',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
    },
    {
      key: 'name',
      header: 'Tên phiếu'
    },
    {
      key: 'assignee',
      header: 'Chuyên viên phụ trách'
    },
    {
      key: 'deadline',
      header: 'Hạn trả lời'
    },
    {
      key: 'status',
      header: 'Trạng thái phiếu',
      render: (value) => <ModernBadge variant="danger">{value}</ModernBadge>
    },
    {
      key: 'actions',
      header: 'Hành động',
      align: 'center' as const,
      width: '120px',
      render: () => (
        <div className="flex items-center justify-center">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex">
      <Sidebar items={sidebarItems} />

      <main className="flex-1 ml-60 p-8 bg-gray-50/30">
        <ModernPageHeader
          title="Quản lý phiếu lấy ý kiến"
          description="Quản lý và theo dõi các phiếu lấy ý kiến"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/', icon: Home },
            { label: 'Quản lý phiếu lấy ý kiến' }
          ]}
        />

        <ModernCard padding="none">
          <ModernTabs
            tabs={tabs.map(tab => ({
              key: tab.key,
              label: tab.label,
              count: tab.key === 'expired' ? expiredVotes.length : 0
            }))}
            activeTab={activeTab}
            onChange={(key) => {
              setActiveTab(key as TabType);
              setCurrentPage(1);
            }}
          />

          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Danh sách phiếu lấy ý kiến</h3>

              <div className="flex items-center gap-2">
                <ModernSearchBar
                  placeholder="Tìm kiếm theo tên phiếu"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="w-80"
                />

                <ModernButton variant="ghost" size="sm" icon={RefreshCw} />
                <ModernButton variant="ghost" size="sm" icon={Upload} />
                <ModernButton variant="secondary" size="sm" icon={Filter}>
                  Bộ lọc
                </ModernButton>
              </div>
            </div>
          </div>

          <ModernTable
            columns={tableColumns}
            data={currentData}
            keyField="id"
          />

          {currentData.length > 0 && (
            <ModernPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </ModernCard>
      </main>
    </div>
  );
};

export default BieuQuyetPage;
