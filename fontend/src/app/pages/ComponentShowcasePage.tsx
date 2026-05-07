import React from 'react';
import {
  SearchInput,
  IconButton,
  FilterButton,
  ExportButton,
  OutlineButton,
  BadgeStatus,
  KPIStatCard,
  EmptyState,
} from '../components/global';
import { Button } from '../components/ui/hp-button';
import {
  Settings,
  Calendar,
  Users,
  FileText,
  Download,
  Trash2,
  Inbox,
  Plus,
} from 'lucide-react';

const ComponentShowcasePage = () => {
  return (
    <div className="p-8 space-y-12">
      <div>
        <h1 className="text-[28px] font-semibold text-[#111827] mb-2">
          Component Showcase
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Tất cả components trong design system iCPV Cabinet
        </p>
      </div>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#111827]">Buttons</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-[14px] font-medium text-[#6B7280] mb-3">Primary Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm">
                  Small Button
                </Button>
                <Button variant="primary" size="default">
                  Default Button
                </Button>
                <Button variant="primary" size="lg">
                  Large Button
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-[14px] font-medium text-[#6B7280] mb-3">Outline Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <OutlineButton variant="primary">Primary Outline</OutlineButton>
                <OutlineButton variant="secondary">Secondary Outline</OutlineButton>
                <OutlineButton variant="success">Success Outline</OutlineButton>
                <OutlineButton variant="danger">Danger Outline</OutlineButton>
              </div>
            </div>

            <div>
              <h3 className="text-[14px] font-medium text-[#6B7280] mb-3">Special Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <FilterButton />
                <FilterButton active count={5} />
                <ExportButton />
                <ExportButton variant="default" />
              </div>
            </div>

            <div>
              <h3 className="text-[14px] font-medium text-[#6B7280] mb-3">Icon Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <IconButton icon={<Settings className="h-4 w-4" />} variant="default" />
                <IconButton icon={<Download className="h-4 w-4" />} variant="primary" />
                <IconButton icon={<Trash2 className="h-4 w-4" />} variant="ghost" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#111827]">Badge Status</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex flex-wrap gap-3">
            <BadgeStatus status="success" label="Hoàn thành" />
            <BadgeStatus status="warning" label="Đang xử lý" />
            <BadgeStatus status="error" label="Từ chối" />
            <BadgeStatus status="info" label="Thông tin" />
            <BadgeStatus status="neutral" label="Trung lập" />
            <BadgeStatus status="draft" label="Nháp" />
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <BadgeStatus status="success" label="Small" size="sm" />
            <BadgeStatus status="warning" label="Small" size="sm" />
            <BadgeStatus status="error" label="Small" size="sm" dot={false} />
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#111827]">KPI Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPIStatCard
            title="Phiên họp hôm nay"
            value="12"
            subtitle="Đang diễn ra: 3"
            icon={Calendar}
            color="primary"
            trend={{ value: '15%', direction: 'up' }}
          />
          <KPIStatCard
            title="Tổng người dùng"
            value="156"
            subtitle="Active users"
            icon={Users}
            color="success"
          />
          <KPIStatCard
            title="Tài liệu mới"
            value="42"
            subtitle="Tuần này"
            icon={FileText}
            color="info"
            trend={{ value: '5%', direction: 'down' }}
          />
          <KPIStatCard
            title="Cần duyệt"
            value="8"
            subtitle="Chờ xử lý"
            icon={FileText}
            color="warning"
          />
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#111827]">Search Input</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="max-w-md space-y-4">
            <SearchInput placeholder="Tìm kiếm phiên họp..." />
            <SearchInput placeholder="Tìm kiếm tài liệu..." />
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#111827]">Typography</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#111827]">
              Page Title - 28px Semibold
            </h1>
          </div>
          <div>
            <h2 className="text-[18px] font-semibold text-[#111827]">
              Section Title - 18px Semibold
            </h2>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#111827]">
              Card Title - 16px Semibold
            </h3>
          </div>
          <div>
            <p className="text-[13px] text-[#111827]">
              Body Text - 13px Regular - Lorem ipsum dolor sit amet, consectetur
              adipiscing elit.
            </p>
          </div>
          <div>
            <p className="text-[13px] text-[#6B7280]">
              Secondary Text - 13px Regular - Lorem ipsum dolor sit amet.
            </p>
          </div>
          <div>
            <p className="text-[12px] text-[#9CA3AF]">
              Small Text - 12px Regular - Lorem ipsum dolor sit amet.
            </p>
          </div>
        </div>
      </section>

      {/* Empty State */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#111827]">Empty State</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <EmptyState
            icon={Inbox}
            title="Chưa có dữ liệu"
            description="Hiện tại chưa có phiên họp nào. Bấm nút bên dưới để tạo phiên họp mới."
            action={
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                Tạo phiên họp mới
              </Button>
            }
          />
        </div>
      </section>

      {/* Colors */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#111827]">Colors</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="h-24 rounded-lg bg-[#C8102E] mb-2"></div>
              <p className="text-[12px] font-medium text-[#111827]">Primary</p>
              <p className="text-[11px] text-[#6B7280]">#C8102E</p>
            </div>
            <div>
              <div className="h-24 rounded-lg bg-[#16A34A] mb-2"></div>
              <p className="text-[12px] font-medium text-[#111827]">Success</p>
              <p className="text-[11px] text-[#6B7280]">#16A34A</p>
            </div>
            <div>
              <div className="h-24 rounded-lg bg-[#F59E0B] mb-2"></div>
              <p className="text-[12px] font-medium text-[#111827]">Warning</p>
              <p className="text-[11px] text-[#6B7280]">#F59E0B</p>
            </div>
            <div>
              <div className="h-24 rounded-lg bg-[#EF4444] mb-2"></div>
              <p className="text-[12px] font-medium text-[#111827]">Error</p>
              <p className="text-[11px] text-[#6B7280]">#EF4444</p>
            </div>
            <div>
              <div className="h-24 rounded-lg bg-[#3B82F6] mb-2"></div>
              <p className="text-[12px] font-medium text-[#111827]">Info</p>
              <p className="text-[11px] text-[#6B7280]">#3B82F6</p>
            </div>
            <div>
              <div className="h-24 rounded-lg bg-[#111827] mb-2"></div>
              <p className="text-[12px] font-medium text-[#111827]">Text Primary</p>
              <p className="text-[11px] text-[#6B7280]">#111827</p>
            </div>
            <div>
              <div className="h-24 rounded-lg bg-[#6B7280] mb-2"></div>
              <p className="text-[12px] font-medium text-[#111827]">Text Secondary</p>
              <p className="text-[11px] text-[#6B7280]">#6B7280</p>
            </div>
            <div>
              <div className="h-24 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] mb-2"></div>
              <p className="text-[12px] font-medium text-[#111827]">Background</p>
              <p className="text-[11px] text-[#6B7280]">#F3F4F6</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ComponentShowcasePage;
