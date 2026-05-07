import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/hp-card';
import { Button } from '../components/ui/hp-button';
import { Badge } from '../components/ui/hp-badge';
import { SearchInput } from '../components/ui/hp-search';
import { KPICard } from '../components/ui/hp-kpi-card';
import { EmptyState } from '../components/ui/hp-empty-state';
import { ErrorState } from '../components/ui/hp-error-state';
import { NoResultState } from '../components/ui/hp-no-result';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/hp-tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/hp-table';
import { 
  Plus, 
  Download, 
  Trash2, 
  Calendar, 
  Users, 
  FileText, 
  TrendingUp,
  Package
} from 'lucide-react';

const ComponentShowcase = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="pt-16 p-8">
        <PageHeader
          title="UI Component Library"
          description="Thư viện components cho Hệ thống quản lý phòng họp không giấy - UBND Hải Phòng"
        />

        <div className="space-y-8">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Design Tokens - Màu sắc</CardTitle>
              <CardDescription>Hệ thống màu chính thống cho hành chính công vụ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <div className="h-20 rounded-lg bg-[#C8102E] mb-2"></div>
                  <p className="text-xs font-medium text-[#111827]">Primary Red</p>
                  <p className="text-xs text-[#6B7280]">#C8102E</p>
                </div>
                <div>
                  <div className="h-20 rounded-lg bg-[#A90F14] mb-2"></div>
                  <p className="text-xs font-medium text-[#111827]">Dark Red</p>
                  <p className="text-xs text-[#6B7280]">#A90F14</p>
                </div>
                <div>
                  <div className="h-20 rounded-lg bg-[#16A34A] mb-2"></div>
                  <p className="text-xs font-medium text-[#111827]">Success</p>
                  <p className="text-xs text-[#6B7280]">#16A34A</p>
                </div>
                <div>
                  <div className="h-20 rounded-lg bg-[#F59E0B] mb-2"></div>
                  <p className="text-xs font-medium text-[#111827]">Warning</p>
                  <p className="text-xs text-[#6B7280]">#F59E0B</p>
                </div>
                <div>
                  <div className="h-20 rounded-lg bg-[#2563EB] mb-2"></div>
                  <p className="text-xs font-medium text-[#111827]">Info</p>
                  <p className="text-xs text-[#6B7280]">#2563EB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Các loại nút bấm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button variant="primary" size="sm">
                    <Plus className="h-4 w-4" />
                    Primary Small
                  </Button>
                  <Button variant="primary" size="default">
                    <Plus className="h-4 w-4" />
                    Primary Default
                  </Button>
                  <Button variant="primary" size="lg">
                    <Plus className="h-4 w-4" />
                    Primary Large
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary">
                    <Download className="h-4 w-4" />
                    Secondary
                  </Button>
                  <Button variant="ghost">
                    Ghost Button
                  </Button>
                  <Button variant="danger">
                    <Trash2 className="h-4 w-4" />
                    Danger
                  </Button>
                  <Button variant="success">
                    Success
                  </Button>
                  <Button variant="link">
                    Link Button
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="primary" disabled>
                    Disabled
                  </Button>
                  <Button variant="primary" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges - Trạng thái</CardTitle>
              <CardDescription>Badge hiển thị trạng thái</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="default">Mặc định</Badge>
                <Badge variant="primary">Quan trọng</Badge>
                <Badge variant="success">Thành công</Badge>
                <Badge variant="warning">Cảnh báo</Badge>
                <Badge variant="error">Lỗi</Badge>
                <Badge variant="info">Thông tin</Badge>
                <Badge variant="success" size="sm">Small</Badge>
                <Badge variant="info" size="lg">Large</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Search Input */}
          <Card>
            <CardHeader>
              <CardTitle>Search Input</CardTitle>
              <CardDescription>Ô tìm kiếm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <SearchInput placeholder="Tìm kiếm theo tên, mã..." />
                <SearchInput placeholder="Tìm kiếm tài liệu..." />
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <Card>
            <CardHeader>
              <CardTitle>KPI Cards</CardTitle>
              <CardDescription>Card hiển thị chỉ số</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Phiên họp tháng này"
                  value="24"
                  icon={Calendar}
                  trend={{ value: '+12%', isPositive: true }}
                  iconBgColor="bg-[#EFF6FF]"
                  iconColor="text-[#2563EB]"
                />
                <KPICard
                  title="Tài liệu"
                  value="156"
                  icon={FileText}
                  trend={{ value: '+8%', isPositive: true }}
                  iconBgColor="bg-[#F0FDF4]"
                  iconColor="text-[#16A34A]"
                />
                <KPICard
                  title="Thành viên"
                  value="248"
                  icon={Users}
                  iconBgColor="bg-[#FFFBEB]"
                  iconColor="text-[#F59E0B]"
                />
                <KPICard
                  title="Tăng trưởng"
                  value="15%"
                  icon={TrendingUp}
                  trend={{ value: '-3%', isPositive: false }}
                  iconBgColor="bg-[#FEF2F2]"
                  iconColor="text-[#EF4444]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
              <CardDescription>Tab điều hướng</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tab1">
                <TabsList>
                  <TabsTrigger value="tab1">Tổng quan</TabsTrigger>
                  <TabsTrigger value="tab2">Chi tiết</TabsTrigger>
                  <TabsTrigger value="tab3">Thống kê</TabsTrigger>
                  <TabsTrigger value="tab4">Cài đặt</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                  <p className="text-sm text-[#6B7280]">Nội dung tab Tổng quan</p>
                </TabsContent>
                <TabsContent value="tab2">
                  <p className="text-sm text-[#6B7280]">Nội dung tab Chi tiết</p>
                </TabsContent>
                <TabsContent value="tab3">
                  <p className="text-sm text-[#6B7280]">Nội dung tab Thống kê</p>
                </TabsContent>
                <TabsContent value="tab4">
                  <p className="text-sm text-[#6B7280]">Nội dung tab Cài đặt</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Table</CardTitle>
              <CardDescription>Bảng dữ liệu chuẩn</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã phiên họp</TableHead>
                    <TableHead>Tên phiên họp</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Địa điểm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">PH2026001</TableCell>
                    <TableCell>Họp Ban Chấp hành</TableCell>
                    <TableCell>25/03/2026 14:00</TableCell>
                    <TableCell>Phòng họp A</TableCell>
                    <TableCell>
                      <Badge variant="info">Sắp diễn ra</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Chi tiết</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">PH2026002</TableCell>
                    <TableCell>Họp triển khai kế hoạch</TableCell>
                    <TableCell>26/03/2026 08:30</TableCell>
                    <TableCell>Hội trường lớn</TableCell>
                    <TableCell>
                      <Badge variant="success">Đã chuẩn bị</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Chi tiết</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">PH2026003</TableCell>
                    <TableCell>Họp giao ban tuần</TableCell>
                    <TableCell>27/03/2026 15:00</TableCell>
                    <TableCell>Phòng họp B</TableCell>
                    <TableCell>
                      <Badge variant="warning">Đang chuẩn bị</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Chi tiết</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Empty States */}
          <Card>
            <CardHeader>
              <CardTitle>Empty & Error States</CardTitle>
              <CardDescription>Trạng thái rỗng, lỗi, không có kết quả</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="empty">
                <TabsList>
                  <TabsTrigger value="empty">Empty State</TabsTrigger>
                  <TabsTrigger value="error">Error State</TabsTrigger>
                  <TabsTrigger value="noresult">No Result</TabsTrigger>
                </TabsList>
                <TabsContent value="empty">
                  <div className="bg-[#F9FAFB] rounded-lg p-4">
                    <EmptyState
                      icon={<Package className="h-8 w-8 text-[#9CA3AF]" />}
                      title="Chưa có dữ liệu"
                      description="Hiện tại chưa có phiên họp nào. Bắt đầu tạo phiên họp đầu tiên."
                      action={
                        <Button variant="primary">
                          <Plus className="h-4 w-4" />
                          Tạo phiên họp
                        </Button>
                      }
                    />
                  </div>
                </TabsContent>
                <TabsContent value="error">
                  <div className="bg-[#F9FAFB] rounded-lg p-4">
                    <ErrorState
                      title="Không thể tải dữ liệu"
                      description="Đã xảy ra lỗi khi tải danh sách phiên họp. Vui lòng thử lại."
                      onRetry={() => alert('Đang tải lại...')}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="noresult">
                  <div className="bg-[#F9FAFB] rounded-lg p-4">
                    <NoResultState
                      searchQuery="họp triển khai 2025"
                      onClear={() => alert('Đã xóa bộ lọc')}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Hệ thống chữ - Be Vietnam Pro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#6B7280] mb-2">Page Title (28px semibold)</p>
                  <h1>Hệ thống quản lý phòng họp không giấy</h1>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-2">Section Title (20px semibold)</p>
                  <h2>Phiên họp sắp diễn ra</h2>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-2">Card Title (16px semibold)</p>
                  <h3>Họp Ban Chấp hành Đảng bộ thành phố</h3>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-2">Body (14px regular)</p>
                  <p>Nội dung văn bản thông thường trong hệ thống, được thiết kế để dễ đọc và phù hợp với môi trường hành chính công vụ.</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-2">Caption (12px regular)</p>
                  <p className="text-caption">Chữ phụ, ghi chú, thông tin bổ sung</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ComponentShowcase;
