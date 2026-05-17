import React, { useState, useMemo } from 'react';
import { X, Search, Eye, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Badge } from '@/common/components/ui/badge';
import { Card, CardContent } from '@/common/components/ui/card';
import { DataTable } from '@/common/components/table-engine/DataTable';
import { DataToolbar } from '@/common/components/table-engine/DataToolbar';
import { TableEngineConfig, ColumnDef } from '@/common/components/table-engine/table.types';
import { cn } from '@/common/utils/cn';
import { AttendanceDetailModal, AttendanceDetailRecord } from './AttendanceDetailModal';

type TabType = 'donvi' | 'khachmoi';

interface AttendanceRecord {
  id: number;
  unit: string;
  name: string;
  position: string;
  status: 'present' | 'pending' | 'absent';
  reasonAbsent?: string;
  replacementPerson?: {
    name: string;
    position: string;
    unit: string;
  };
  type: 'individual' | 'unit' | 'guest';
  isChair?: boolean;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('donvi');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceDetailRecord | null>(null);
  const pageSize = 10;

  // Mock data mở rộng để hỗ trợ 2 tab
  const mockData: AttendanceRecord[] = [
    { id: 1, unit: 'Sở Kế hoạch và Đầu tư', name: 'Nguyễn Văn A', position: 'Phó Chủ tịch UBND', status: 'present', type: 'individual', isChair: true },
    { id: 2, unit: 'Sở Tài chính', name: 'Trần Thị B', position: 'Trưởng phòng', status: 'present', type: 'unit' },
    { id: 3, unit: 'Sở Giáo dục và Đào tạo', name: 'Lê Văn C', position: 'Phó giám đốc', status: 'pending', type: 'unit' },
    { id: 4, unit: 'Sở Y tế', name: 'Phạm Thị D', position: 'Giám đốc', status: 'absent', type: 'unit', reasonAbsent: 'Đi công tác', replacementPerson: { name: 'Nguyễn Văn X', position: 'Phó Giám đốc', unit: 'Sở Y tế' } },
    { id: 5, unit: 'Sở Công Thương', name: 'Hoàng Văn E', position: 'Chuyên viên', status: 'present', type: 'individual' },
    { id: 20, unit: 'Công ty ABC', name: 'Ông Nguyễn Văn Khách', position: 'Giám đốc', status: 'present', type: 'guest' },
    { id: 21, unit: 'Tập đoàn XYZ', name: 'Bà Trần Thị Mời', position: 'Chuyên gia', status: 'pending', type: 'guest' },
    { id: 22, unit: 'Tổng công ty 123', name: 'Ông Lê Hoàng Nam', position: 'Phó Tổng Giám đốc', status: 'absent', type: 'guest', reasonAbsent: 'Trùng lịch công tác', replacementPerson: { name: 'Bà Phạm Minh Thư', position: 'Trưởng phòng Đối ngoại', unit: 'Tổng công ty 123' } }
  ];

  const stats = useMemo(() => {
    return {
      total: mockData.length,
      present: mockData.filter((r) => r.status === 'present').length,
      pending: mockData.filter((r) => r.status === 'pending').length,
      absent: mockData.filter((r) => r.status === 'absent').length,
      donViCount: mockData.filter(r => r.type !== 'guest').length,
      khachMoiCount: mockData.filter(r => r.type === 'guest').length,
    };
  }, []);

  const filteredData = useMemo(() => {
    let data = mockData;
    
    // Filter by tab
    if (activeTab === 'donvi') {
      data = data.filter(r => r.type !== 'guest');
    } else {
      data = data.filter(r => r.type === 'guest');
    }

    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      (record) => record.name.toLowerCase().includes(query)
    );
  }, [searchQuery, activeTab]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage]);

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">Có tham gia</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1 text-xs rounded-full border-none">Chưa xác nhận</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-3 py-1 text-xs rounded-full border-none">Báo vắng</Badge>;
    }
  };

  const tableConfig: TableEngineConfig<AttendanceRecord> = useMemo(() => {
    const baseColumns: ColumnDef<AttendanceRecord>[] = [
      { key: 'unit', header: 'Đơn vị' },
      { key: 'name', header: 'Họ và tên', className: 'font-medium' },
      { key: 'position', header: 'Chức vụ' },
    ];

    if (activeTab === 'donvi') {
      baseColumns.push({
        key: 'isChair',
        header: 'Chủ trì',
        width: '120px',
        align: 'center',
        render: (row) => row.isChair ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-[#C8102E]">
            Chủ trì
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )
      });
    }

    // Thêm cột "Đại biểu đi thay" được thiết kế hợp lý, đẹp mắt
    baseColumns.push({
      key: 'replacementPerson',
      header: 'Đại biểu đi thay',
      width: '150px',
      className: 'whitespace-nowrap',
      render: (row) => {
        if (row.status === 'absent' && row.replacementPerson) {
          return (
            <div className="flex flex-col py-1 whitespace-nowrap">
              <span className="font-semibold text-gray-900 text-sm leading-tight whitespace-nowrap">
                {row.replacementPerson.name}
              </span>
              <span className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
                {row.replacementPerson.position}
              </span>
            </div>
          );
        }
        return <span className="text-gray-400 text-xs">-</span>;
      }
    });

    // Thêm cột "Trạng thái"
    baseColumns.push({
      key: 'status',
      header: 'Trạng thái',
      render: (row) => getStatusBadge(row.status)
    });

    return {
      columns: baseColumns,
      rowActions: [], // Bỏ hoàn toàn cột thao tác theo yêu cầu
    };
  }, [activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white z-10">
          <h2 className="text-xl heading text-gray-900">Danh sách điểm danh</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Tổng số', value: stats.total, color: 'from-gray-50 to-gray-100', text: 'text-gray-700' },
              { label: 'Có mặt', value: stats.present, color: 'from-green-50 to-green-100/50', text: 'text-green-700' },
              { label: 'Chưa xác nhận', value: stats.pending, color: 'from-amber-50 to-amber-100/50', text: 'text-amber-700' },
              { label: 'Báo vắng', value: stats.absent, color: 'from-red-50 to-red-100/50', text: 'text-red-700' },
            ].map((stat, i) => (
              <Card key={i} className={cn("border-none shadow-none bg-gradient-to-br", stat.color)}>
                <CardContent className="p-4">
                  <p className={cn("text-xs uppercase tracking-wider font-semibold mb-1", stat.text)}>{stat.label}</p>
                  <p className="text-3xl heading text-gray-900">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sliding Tabs Pattern */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-gray-50 p-1 border-b border-gray-200">
              <div className="relative flex w-full">
                <div 
                  className="absolute top-0 bottom-0 w-1/2 bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out"
                  style={{ transform: activeTab === 'donvi' ? 'translateX(0%)' : 'translateX(100%)' }}
                />
                {[
                  { id: 'donvi', label: 'Đơn vị', count: stats.donViCount },
                  { id: 'khachmoi', label: 'Khách mời', count: stats.khachMoiCount }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as TabType); setCurrentPage(1); }}
                    className={cn(
                      'relative w-1/2 py-2.5 text-sm font-medium transition-colors z-10',
                      activeTab === tab.id ? 'text-[#C8102E]' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {tab.label}
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs transition-colors',
                        activeTab === tab.id ? 'bg-red-50 text-[#C8102E]' : 'bg-gray-200 text-gray-600'
                      )}>
                        {tab.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-0 space-y-0">
              {/* DataToolbar for Search */}
              <DataToolbar
                searchQuery={searchQuery}
                onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                searchPlaceholder={`Tìm kiếm trong danh sách ${activeTab === 'donvi' ? 'đơn vị' : 'khách mời'}...`}
              />

              <div className="p-6 pt-2">
                {/* Table Engine Implementation */}
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <DataTable
                    data={paginatedData}
                    config={tableConfig}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filteredData.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-center bg-gray-50/50">
          <Button
            variant="primary"
            onClick={onClose}
            className="bg-[#C8102E] hover:bg-[#a80d26] px-12 rounded-full h-[44px]"
          >
            Đóng
          </Button>
        </div>
      </div>

      <AttendanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        record={selectedRecord}
      />
    </div>
  );
};

