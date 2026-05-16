import React, { useState } from 'react';
import { Filter, RefreshCw, Upload, Eye, Home, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Card, CardContent } from '@/common/components/ui/card';
import { Badge } from '@/common/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/common/components/ui/table';
import { Pagination } from '@/common/components/ui/app-pagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/common/components/ui/tabs';

type TabType = 'unanswered' | 'answered' | 'expired';

interface Vote {
  id: number;
  name: string;
  assignee: string;
  deadline: string;
  status: string;
}

export const PollManagement = () => {
  const [activeTab, setActiveTab] = useState<string>('unanswered');
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

  const getCurrentData = () => {
    if (activeTab === 'expired') return expiredVotes;
    return [];
  };

  const currentData = getCurrentData();
  const totalItems = currentData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="p-8 bg-gray-50/30 w-full min-h-screen">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Home className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span>Quản lý họp</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 body">Quản lý phiếu lấy ý kiến</span>
          </div>
          <h1 className="text-2xl heading text-gray-900">Quản lý phiếu lấy ý kiến</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và theo dõi các phiếu lấy ý kiến</p>
        </div>

        <Card className="shadow-sm border-gray-200">
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCurrentPage(1); }} className="w-full">
            <div className="px-6 pt-4 border-b border-gray-200">
              <TabsList className="bg-transparent border-b-0 space-x-4">
                <TabsTrigger 
                  value="unanswered" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2"
                >
                  Phiếu chưa trả lời
                </TabsTrigger>
                <TabsTrigger 
                  value="answered" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2"
                >
                  Phiếu đã trả lời
                </TabsTrigger>
                <TabsTrigger 
                  value="expired" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2"
                >
                  Phiếu đã hết hạn
                  <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">{expiredVotes.length}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="btn-primary text-gray-900">Danh sách phiếu lấy ý kiến</h3>

                <div className="flex items-center gap-2">
                  <div className="relative w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                      placeholder="Tìm kiếm theo tên phiếu"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" className="h-9">
                    <Filter className="h-4 w-4 mr-2" />
                    Bộ lọc
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center">STT</TableHead>
                    <TableHead>Tên phiếu</TableHead>
                    <TableHead>Chuyên viên phụ trách</TableHead>
                    <TableHead>Hạn trả lời</TableHead>
                    <TableHead>Trạng thái phiếu</TableHead>
                    <TableHead className="w-[120px] text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.length > 0 ? (
                    currentData.map((vote, index) => (
                      <TableRow key={vote.id}>
                        <TableCell className="text-center">
                          {(currentPage - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell className="body">{vote.name}</TableCell>
                        <TableCell>{vote.assignee}</TableCell>
                        <TableCell>{vote.deadline}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                            {vote.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {currentData.length > 0 && (
              <div className="px-6 border-t border-gray-200">
                <Pagination
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
              </div>
            )}
          </Tabs>
        </Card>
    </div>
  );
};
