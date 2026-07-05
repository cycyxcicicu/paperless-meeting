import {
    BarChart3,
    Briefcase,
    Building2,
    Calendar,
    FileText,
    History,
    LayoutDashboard,
    LucideIcon,
    Mail,
    MapPin,
    Settings,
    Shield,
    Users,
    Vote,
    Bookmark,
    BookOpen,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon?: LucideIcon;
  badge?: string;
  subItems?: { name: string; path: string; icon?: LucideIcon; badge?: string }[];
}

export const PHIEN_HOP_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    name: 'Quản lý phiên họp',
    path: '/phien-hop',
    icon: LayoutDashboard,
  },
  {
    name: 'Tài liệu',
    path: '/ca-nhan/phien-hop-luu',
    icon: FileText,
    subItems: [
      { name: 'Phiên họp đã lưu', path: '/ca-nhan/phien-hop-luu' },
      { name: 'Ghi chú của tôi', path: '/ca-nhan/ghi-chu' },
    ],
  },
  {
    name: 'Mẫu thư mời',
    path: '/phien-hop/mau-thu-moi',
    icon: Mail,
  }
];

export const QUAN_TRI_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    name: 'Danh sách người dùng',
    path: '/nguoi-dung',
    icon: Users,
  },
  {
    name: 'Danh sách vai trò',
    path: '/nguoi-dung/vai-tro',
    icon: Shield,
  },
  {
    name: 'Danh sách đơn vị',
    path: '/nguoi-dung/don-vi',
    icon: Building2,
  },
  {
    name: 'Danh mục chức vụ',
    path: '/nguoi-dung/chuc-vu',
    icon: Briefcase,
  },
  {
    name: 'Lịch sử truy cập',
    path: '/nguoi-dung/lich-su',
    icon: History,
  },
];

export const LICH_HOP_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    name: 'Lịch họp',
    path: '/phong-hop',
    icon: Calendar,
  },
  {
    name: 'Địa điểm họp',
    path: '/phong-hop/dia-diem',
    icon: MapPin,
  },
];

export const PHONG_HOP_SIDEBAR_ITEMS: SidebarItem[] = LICH_HOP_SIDEBAR_ITEMS;
