import React, { useState, useMemo } from 'react';
import { X, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Badge } from '@/common/components/ui/badge';
import { Card, CardContent  } from '@/common/components/ui/card';
import { AttendanceDetailModal, AttendanceDetailRecord } from './AttendanceDetailModal';

type TabType = 'individual' | 'unit' | 'guest' | 'absent';

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
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceDetailRecord | null>(null);
  const pageSize = 10;

  // Mock data
  const mockData: AttendanceRecord[] = [
    {
      id: 1,
      unit: 'Sở Kế hoạch và Đầu tư',
      name: 'Nguyễn Văn A',
      position: 'Phó Chủ tịch UBND',
      status: 'present',
    },
    {
      id: 2,
      unit: 'Sở Tài chính',
      name: 'Trần Thị B',
      position: 'Trưởng phòng',
      status: 'present',
    },
    {
      id: 3,
      unit: 'Sở Giáo dục và Đào tạo',
      name: 'Lê Văn C',
      position: 'Phó giám đốc',
      status: 'pending',
    },
    {
      id: 4,
      unit: 'Sở Y tế',
      name: 'Phạm Thị D',
      position: 'Giám đốc',
      status: 'absent',
      reasonAbsent: 'Đi công tác nước ngoài theo lịch trình đã được phê duyệt từ trước',
      replacementPerson: {
        name: 'Nguyễn Văn X',
        position: 'Phó Giám đốc',
        unit: 'Sở Y tế',
      },
    },
    {
      id: 5,
      unit: 'Sở Công Thương',
      name: 'Hoàng Văn E',
      position: 'Chuyên viên',
      status: 'present',
    },
    {
      id: 6,
      unit: 'Sở Nội vụ',
      name: 'Ngô Thị F',
      position: 'Trưởng phòng',
      status: 'present',
    },
    {
      id: 7,
      unit: 'Sở Xây dựng',
      name: 'Đặng Văn G',
      position: 'Phó giám đốc',
      status: 'pending',
    },
    {
      id: 8,
      unit: 'Sở Nông nghiệp và Phát triển nông thôn',
      name: 'Vũ Thị H',
      position: 'Giám đốc',
      status: 'present',
    },
    {
      id: 9,
      unit: 'Sở Văn hóa và Thể thao',
      name: 'Bùi Văn I',
      position: 'Trưởng phòng',
      status: 'absent',
      reasonAbsent: 'Lý do sức khỏe, cần nghỉ dưỡng theo chỉ định của bác sĩ',
    },
    {
      id: 10,
      unit: 'Sở Khoa học và Công nghệ',
      name: 'Đinh Thị K',
      position: 'Chuyên viên',
      status: 'present',
    },
  ];

  // Statistics
  const stats = useMemo(() => {
    const total = mockData.length;
    const present = mockData.filter((r) => r.status === 'present').length;
    const pending = mockData.filter((r) => r.status === 'pending').length;
    const absent = mockData.filter((r) => r.status === 'absent').length;

    return { total, present, pending, absent };
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return mockData;

    const query = searchQuery.toLowerCase();
    return mockData.filter(
      (record) =>
        record.name.toLowerCase().includes(query) ||
        record.unit.toLowerCase().includes(query) ||
        record.position.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage]);

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">
            Có tham gia
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1 text-xs rounded-full border-none">
            Chưa xác nhận
          </Badge>
        );
      case 'absent':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-3 py-1 text-xs rounded-full border-none">
            Báo vắng
          </Badge>
        );
    }
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'individual':
        return 'Cá nhân';
      case 'unit':
        return 'Đơn vị';
      case 'guest':
        return 'Khách mời';
      case 'absent':
        return 'Báo vắng';
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'individual':
        return 'Tìm kiếm cá nhân';
      case 'unit':
        return 'Tìm kiếm đơn vị';
      case 'guest':
        return 'Tìm kiếm khách mời';
      case 'absent':
        return 'Tìm kiếm người báo vắng';
    }
  };

  const handleViewDetail = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl heading text-gray-900">Điểm danh</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Tabs */}
          <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
            {(['individual', 'unit', 'guest', 'absent'] as TabType[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                    setSearchQuery('');
                  }}
                  className={`pb-3 body text-[15px] border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-[#C8102E] text-[#C8102E]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {getTabLabel(tab)}
                </button>
              )
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 rounded-xl">
              <CardContent className="p-4">
                <p className="text-sm body text-green-700 mb-1">Tổng</p>
                <p className="text-3xl heading text-green-900">
                  {stats.total}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 rounded-xl">
              <CardContent className="p-4">
                <p className="text-sm body text-blue-700 mb-1">
                  Xác nhận tham gia
                </p>
                <p className="text-3xl heading text-blue-900">
                  {stats.present}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 rounded-xl">
              <CardContent className="p-4">
                <p className="text-sm body text-amber-700 mb-1">
                  Chưa xác nhận
                </p>
                <p className="text-3xl heading text-amber-900">
                  {stats.pending}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 rounded-xl">
              <CardContent className="p-4">
                <p className="text-sm body text-red-700 mb-1">
                  Báo vắng
                </p>
                <p className="text-3xl heading text-red-900">
                  {stats.absent}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={getSearchPlaceholder()}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 hover:border-[#C8102E]/30 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-all"
            />
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 btn-primary text-gray-600 w-16 text-center">
                    STT
                  </th>
                  <th className="py-3 px-4 btn-primary text-gray-600">
                    Tên đơn vị
                  </th>
                  <th className="py-3 px-4 btn-primary text-gray-600">
                    Tên đại biểu
                  </th>
                  <th className="py-3 px-4 btn-primary text-gray-600">
                    Chức vụ
                  </th>
                  <th className="py-3 px-4 btn-primary text-gray-600">
                    Trạng thái
                  </th>
                  <th className="py-3 px-4 btn-primary text-gray-600 w-24 text-center">
                    Xem
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((record, index) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-gray-700">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{record.unit}</td>
                      <td className="py-3 px-4 text-gray-900 body">
                        {record.name}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {record.position}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-[#C8102E]"
                          onClick={() => handleViewDetail(record)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-gray-400">Không tìm thấy dữ liệu</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-end gap-4 mt-4">
              <span className="text-sm text-gray-600">
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, filteredData.length)} của{' '}
                {filteredData.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm body text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="primary"
            onClick={onClose}
            className="bg-[#C8102E] hover:bg-[#a80d26] px-8 rounded-full"
          >
            Đóng
          </Button>
        </div>
      </div>

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        record={selectedRecord}
      />
    </div>
  );
};
