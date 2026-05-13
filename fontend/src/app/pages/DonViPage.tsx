import React, { useState, useEffect } from "react";
import { QUAN_TRI_SIDEBAR_ITEMS } from '../constants/sidebar';
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Sidebar,
  SidebarItem,
} from "../components/layout/Sidebar";
import { PageHeader } from "../components/layout/PageHeader";
import {
  Users,
  Shield,
  Building2,
  Briefcase,
  History,
  Settings,
  MoreVertical,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Home,
  Search,
  Edit,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Building,
  MapPin,
  Check,
  Eye,
  Info,
  Phone,
  Mail,
  Calendar,
  User,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { UnitInfoTab } from "../components/organization/UnitInfoTab";
import { ChildUnitsTab } from "../components/organization/ChildUnitsTab";
import { UnitUsersTab } from "../components/organization/UnitUsersTab";
import { UserFormModal } from "../components/user/UserFormModal";
import { DeleteUserModal } from "../components/user/DeleteUserModal";
import { UnitFormModal } from "../components/organization/UnitFormModal";
import { DeleteUnitModal } from "../components/organization/DeleteUnitModal";
import { cn } from "../../lib/utils";
import { toast } from "../../lib/toast";



interface TreeNode {
  id: string;
  name: string;
  code: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  level: number;
}

interface Unit {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  parentId?: string;
  isActive: boolean;
}

type TabKey = "info" | "child-units" | "users";

const DonViPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<number[]>(
    [],
  );
  const [selectedTreeNode, setSelectedTreeNode] =
    useState<string>("root");

  // Detail panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] =
    useState<string>("all");

  // User modal state
  const [userFormModal, setUserFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    userId?: number;
    defaultUnitId?: string;
  }>({ isOpen: false, mode: 'create' });

  const [deleteUserModal, setDeleteUserModal] = useState<{
    isOpen: boolean;
    userId?: number;
  }>({ isOpen: false });

  // Unit modal state
  const [unitFormModal, setUnitFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    unitId?: string;
  }>({ isOpen: false, mode: 'create' });

  const [deleteUnitModal, setDeleteUnitModal] = useState<{
    isOpen: boolean;
    unitId?: string;
  }>({ isOpen: false });

  // Tree data
  const [treeData, setTreeData] = useState<TreeNode[]>([
    {
      id: "root",
      name: "Văn phòng UBND thành phố Hải Phòng",
      code: "UBND_HP",
      level: 0,
      isExpanded: true,
      children: [
        {
          id: "1",
          name: "Sở Tài chính",
          code: "STC",
          level: 1,
          isExpanded: false,
          children: [
            {
              id: "1-1",
              name: "Phòng Kế toán",
              code: "PKT",
              level: 2,
            },
            {
              id: "1-2",
              name: "Phòng Ngân sách",
              code: "PNS",
              level: 2,
            },
          ],
        },
        {
          id: "2",
          name: "Sở Kế hoạch và Đầu tư",
          code: "SKHDT",
          level: 1,
          isExpanded: false,
          children: [
            {
              id: "2-1",
              name: "Phòng Kế hoạch",
              code: "PKH",
              level: 2,
            },
            {
              id: "2-2",
              name: "Phòng Đầu tư",
              code: "PDT",
              level: 2,
            },
          ],
        },
        { id: "3", name: "Sở Xây dựng", code: "SXD", level: 1 },
        {
          id: "4",
          name: "Sở Giao thông vận tải",
          code: "SGTVT",
          level: 1,
        },
        {
          id: "5",
          name: "Sở Nông nghiệp và Phát triển nông thôn",
          code: "SNNPTNT",
          level: 1,
        },
        {
          id: "6",
          name: "Sở Công Thương",
          code: "SCT",
          level: 1,
        },
        {
          id: "7",
          name: "Sở Giáo dục và Đào tạo",
          code: "SGDDT",
          level: 1,
        },
        { id: "8", name: "Sở Y tế", code: "SYT", level: 1 },
        {
          id: "9",
          name: "Sở Văn hóa và Thể thao",
          code: "SVHTT",
          level: 1,
        },
        {
          id: "10",
          name: "Sở Khoa học và Công nghệ",
          code: "SKHCN",
          level: 1,
        },
      ],
    },
  ]);

  // Mock unit data
  const allUnits: Unit[] = [
    {
      id: 1,
      name: "Văn phòng UBND thành phố Hải Phòng",
      code: "UBND_HP",
      address: "Số 8 Hoàng Văn Thụ, Hồng Bàng, Hải Phòng",
      phone: "0225.3842.569",
      email: "vanphong@haiphong.gov.vn",
      isActive: true,
    },
    {
      id: 2,
      name: "Sở Tài chính",
      code: "STC",
      address: "Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng",
      phone: "0225.3746.123",
      email: "sotaichinh@haiphong.gov.vn",
      parentId: "root",
      isActive: true,
    },
    {
      id: 3,
      name: "Phòng Kế toán",
      code: "PKT",
      address: "Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng",
      phone: "0225.3746.124",
      email: "ketoan@sotaichinh.haiphong.gov.vn",
      parentId: "1",
      isActive: true,
    },
    {
      id: 4,
      name: "Phòng Ngân sách",
      code: "PNS",
      address: "Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng",
      phone: "0225.3746.125",
      email: "ngansach@sotaichinh.haiphong.gov.vn",
      parentId: "1",
      isActive: true,
    },
    {
      id: 5,
      name: "Sở Kế hoạch và Đầu tư",
      code: "SKHDT",
      address: "Số 45 Lạch Tray, Ngô Quyền, Hải Phòng",
      phone: "0225.3822.456",
      email: "sokehoach@haiphong.gov.vn",
      parentId: "root",
      isActive: true,
    },
  ];

  // Mock unit details database (for detail panel)
  const unitDetailsDatabase: Record<string, any> = {
    UBND_HP: {
      id: "UBND_HP",
      name: "Văn phòng UBND thành phố Hải Phòng",
      code: "UBND_HP",
      address: "Số 8 Hoàng Văn Thụ, Hồng Bàng, Hải Phòng",
      phone: "0225.3842.569",
      email: "vanphong@haiphong.gov.vn",
      establishedDate: "15/05/1955",
      director: "Nguyễn Văn Tùng",
      contactPerson: "Trần Thị Mai",
      description:
        "Văn phòng UBND thành phố Hải Phòng là cơ quan tham mưu, giúp việc cho UBND thành phố trong việc tổ chức, điều hành và quản lý các hoạt động hành chính của thành phố.",
      isActive: true,
      totalMembers: 245,
      totalChildUnits: 10,
    },
    STC: {
      id: "STC",
      name: "Sở Tài chính",
      code: "STC",
      address: "Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng",
      phone: "0225.3746.123",
      email: "sotaichinh@haiphong.gov.vn",
      parentId: "UBND_HP",
      parentName: "Văn phòng UBND thành phố Hải Phòng",
      establishedDate: "20/08/1960",
      director: "Trần Thị Mai",
      contactPerson: "Phạm Văn Hòa",
      description:
        "Sở Tài chính là cơ quan chuyên môn thuộc UBND thành phố, có chức năng tham mưu, giúp UBND thành phố thực hiện chức năng quản lý nhà nước về tài chính.",
      isActive: true,
      totalMembers: 85,
      totalChildUnits: 2,
    },
    PKT: {
      id: "PKT",
      name: "Phòng Kế toán",
      code: "PKT",
      address: "Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng",
      phone: "0225.3746.124",
      email: "ketoan@sotaichinh.haiphong.gov.vn",
      parentId: "STC",
      parentName: "Sở Tài chính",
      establishedDate: "01/01/1965",
      director: "Phạm Văn Hòa",
      contactPerson: "Nguyễn Thị Lan",
      description:
        "Phòng Kế toán chịu trách nhiệm quản lý, điều hành công tác kế toán, hạch toán và báo cáo tài chính của Sở.",
      isActive: true,
      totalMembers: 28,
      totalChildUnits: 0,
    },
    PNS: {
      id: "PNS",
      name: "Phòng Ngân sách",
      code: "PNS",
      address: "Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng",
      phone: "0225.3746.125",
      email: "ngansach@sotaichinh.haiphong.gov.vn",
      parentId: "STC",
      parentName: "Sở Tài chính",
      establishedDate: "01/01/1965",
      director: "Lê Thị Hương",
      contactPerson: "Vũ Văn Nam",
      description:
        "Phòng Ngân sách chịu trách nhiệm xây dựng, quản lý và điều hành ngân sách của Sở theo quy định.",
      isActive: true,
      totalMembers: 32,
      totalChildUnits: 0,
    },
    SKHDT: {
      id: "SKHDT",
      name: "Sở Kế hoạch và Đầu tư",
      code: "SKHDT",
      address: "Số 45 Lạch Tray, Ngô Quyền, Hải Phòng",
      phone: "0225.3822.456",
      email: "sokehoach@haiphong.gov.vn",
      parentId: "UBND_HP",
      parentName: "Văn phòng UBND thành phố Hải Phòng",
      establishedDate: "15/03/1962",
      director: "Hoàng Văn Minh",
      contactPerson: "Đỗ Thị Lan",
      description:
        "Sở Kế hoạch và Đầu tư là cơ quan chuyên môn thuộc UBND thành phố, thực hiện quản lý nhà nước về kế hoạch và đầu tư.",
      isActive: true,
      totalMembers: 72,
      totalChildUnits: 2,
    },
    PKH: {
      id: "PKH",
      name: "Phòng Kế hoạch",
      code: "PKH",
      address: "Số 45 Lạch Tray, Ngô Quyền, Hải Phòng",
      phone: "0225.3822.457",
      email: "kehoach@sokehoach.haiphong.gov.vn",
      parentId: "SKHDT",
      parentName: "Sở Kế hoạch và Đầu tư",
      establishedDate: "20/04/1962",
      director: "Nguyễn Văn Hoàng",
      contactPerson: "Lê Thị Hà",
      description:
        "Phòng Kế hoạch chịu trách nhiệm xây dựng và quản lý các kế hoạch phát triển kinh tế - xã hội của thành phố.",
      isActive: true,
      totalMembers: 35,
      totalChildUnits: 0,
    },
    PDT: {
      id: "PDT",
      name: "Phòng Đầu tư",
      code: "PDT",
      address: "Số 45 Lạch Tray, Ngô Quyền, Hải Phòng",
      phone: "0225.3822.458",
      email: "dautu@sokehoach.haiphong.gov.vn",
      parentId: "SKHDT",
      parentName: "Sở Kế hoạch và Đầu tư",
      establishedDate: "20/04/1962",
      director: "Trần Văn Đức",
      contactPerson: "Phạm Thị Nga",
      description:
        "Phòng Đầu tư quản lý và điều phối các hoạt động đầu tư, thu hút vốn đầu tư trong và ngoài nước.",
      isActive: true,
      totalMembers: 37,
      totalChildUnits: 0,
    },
    SXD: {
      id: "SXD",
      name: "Sở Xây dựng",
      code: "SXD",
      address: "Số 78 Trần Phú, Hồng Bàng, Hải Phòng",
      phone: "0225.3745.890",
      email: "soxaydung@haiphong.gov.vn",
      parentId: "UBND_HP",
      parentName: "Văn phòng UBND thành phố Hải Phòng",
      establishedDate: "10/06/1958",
      director: "Lê Văn Quang",
      contactPerson: "Nguyễn Thị Thu",
      description:
        "Sở Xây dựng thực hiện quản lý nhà nước về xây dựng, quy hoạch và kiến trúc trên địa bàn thành phố.",
      isActive: true,
      totalMembers: 95,
      totalChildUnits: 0,
    },
    SGTVT: {
      id: "SGTVT",
      name: "Sở Giao thông vận tải",
      code: "SGTVT",
      address: "Số 102 Lạch Tray, Ngô Quyền, Hải Phòng",
      phone: "0225.3856.234",
      email: "sogiaothong@haiphong.gov.vn",
      parentId: "UBND_HP",
      parentName: "Văn phòng UBND thành phố Hải Phòng",
      establishedDate: "25/07/1959",
      director: "Phạm Quốc Hùng",
      contactPerson: "Vũ Thị Linh",
      description:
        "Sở Giao thông vận tải quản lý và phát triển hạ tầng giao thông, vận tải hành khách và hàng hóa.",
      isActive: true,
      totalMembers: 128,
      totalChildUnits: 0,
    },
    SNNPTNT: {
      id: "SNNPTNT",
      name: "Sở Nông nghiệp và Phát triển nông thôn",
      code: "SNNPTNT",
      address: "Số 56 Điện Biên Phủ, Lê Chân, Hải Phòng",
      phone: "0225.3874.567",
      email: "sonongnghiep@haiphong.gov.vn",
      parentId: "UBND_HP",
      parentName: "Văn phòng UBND thành phố Hải Phòng",
      establishedDate: "18/09/1960",
      director: "Đỗ Văn Thắng",
      contactPerson: "Hoàng Thị Mai",
      description:
        "Sở Nông nghiệp và Phát triển nông thôn quản lý phát triển nông nghiệp, lâm nghiệp, thủy sản và xây dựng nông thôn mới.",
      isActive: true,
      totalMembers: 110,
      totalChildUnits: 0,
    },
    SCT: {
      id: "SCT",
      name: "Sở Công Thương",
      code: "SCT",
      address: "Số 34 Tô Hiệu, Lê Chân, Hải Phòng",
      phone: "0225.3821.456",
      email: "socongth Hang@haiphong.gov.vn",
      parentId: "UBND_HP",
      parentName: "Văn phòng UBND thành phố Hải Phòng",
      establishedDate: "12/11/1961",
      director: "Nguyễn Đức Mạnh",
      contactPerson: "Trần Văn Bình",
      description:
        "Sở Công Thương quản lý hoạt động công nghiệp, thương mại, xuất nhập khẩu và an toàn thực phẩm.",
      isActive: true,
      totalMembers: 88,
      totalChildUnits: 0,
    },
    SGDDT: {
      id: "SGDDT",
      name: "Sở Giáo dục và Đào tạo",
      code: "SGDDT",
      address: "Số 89 Lạch Tray, Ngô Quyền, Hải Phòng",
      phone: "0225.3842.789",
      email: "sogiaoduc@haiphong.gov.vn",
      parentId: "UBND_HP",
      parentName: "Văn phòng UBND thành phố Hải Phòng",
      establishedDate: "05/01/1956",
      director: "Vũ Thị Lan Anh",
      contactPerson: "Đặng Văn Hải",
      description:
        "Sở Giáo dục và Đào tạo quản lý hệ thống giáo dục mầm non, phổ thông và giáo dục thường xuyên trên địa bàn.",
      isActive: true,
      totalMembers: 156,
      totalChildUnits: 0,
    },
    SYT: {
      id: "SYT",
      name: "Sở Y tế",
      code: "SYT",
      address: "Số 12 Nguyễn Đức Cảnh, Lê Chân, Hải Phòng",
      phone: "0225.3836.123",
      email: "soyte@haiphong.gov.vn",
      parentId: "UBND_HP",
      parentName: "Văn phòng UBND thành phố Hải Phòng",
      establishedDate: "22/03/1955",
      director: "BS. Lê Minh Tuấn",
      contactPerson: "BS. Nguyễn Thị Hồng",
      description:
        "Sở Y tế quản lý và chỉ đạo công tác chăm sóc sức khỏe nhân dân, phòng chống dịch bệnh trên địa bàn.",
      isActive: true,
      totalMembers: 245,
      totalChildUnits: 0,
    },
    SVHTT: {
      id: "SVHTT",
      name: "Sở Văn hóa và Thể thao",
      code: "SVHTT",
      address: "Số 67 Hoàng Văn Thụ, Hồng Bàng, Hải Phòng",
      phone: "0225.3847.234",
      email: "sovanhoa@haiphong.gov.vn",
      parentId: "UBND_HP",
      parentName: "Văn phòng UBND thành phố Hải Phòng",
      establishedDate: "30/04/1957",
      director: "Phạm Thị Hương",
      contactPerson: "Lê Văn Kiên",
      description:
        "Sở Văn hóa và Thể thao quản lý hoạt động văn hóa, nghệ thuật, thể dục thể thao và du lịch trên địa bàn.",
      isActive: true,
      totalMembers: 78,
      totalChildUnits: 0,
    },
    SKHCN: {
      id: "SKHCN",
      name: "Sở Khoa học và Công nghệ",
      code: "SKHCN",
      address: "Số 45 Tôn Đức Thắng, Lê Chân, Hải Phòng",
      phone: "0225.3852.345",
      email: "sokhoahoc@haiphong.gov.vn",
      parentId: "UBND_HP",
      parentName: "Văn phòng UBND thành phố Hải Phòng",
      establishedDate: "15/08/1963",
      director: "TS. Nguyễn Văn Hùng",
      contactPerson: "ThS. Trần Thị Nhung",
      description:
        "Sở Khoa học và Công nghệ quản lý hoạt động nghiên cứu khoa học, ứng dụng công nghệ và sở hữu trí tuệ.",
      isActive: true,
      totalMembers: 65,
      totalChildUnits: 0,
    },
  };

  // Mock child units data
  const allChildUnits: Record<string, any[]> = {
    UBND_HP: [
      {
        id: 1,
        name: "Sở Tài chính",
        code: "STC",
        address: "Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng",
        phone: "0225.3746.123",
        totalMembers: 85,
        isActive: true,
      },
      {
        id: 2,
        name: "Sở Kế hoạch và Đầu tư",
        code: "SKHDT",
        address: "Số 45 Lạch Tray, Ngô Quyền, Hải Phòng",
        phone: "0225.3822.456",
        totalMembers: 72,
        isActive: true,
      },
      {
        id: 3,
        name: "Sở Xây dựng",
        code: "SXD",
        address: "Số 78 Trần Phú, Hồng Bàng, Hải Phòng",
        phone: "0225.3745.890",
        totalMembers: 95,
        isActive: true,
      },
    ],
    STC: [
      {
        id: 6,
        name: "Phòng Kế toán",
        code: "PKT",
        address: "Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng",
        phone: "0225.3746.124",
        totalMembers: 28,
        isActive: true,
      },
      {
        id: 7,
        name: "Phòng Ngân sách",
        code: "PNS",
        address: "Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng",
        phone: "0225.3746.125",
        totalMembers: 32,
        isActive: true,
      },
    ],
  };

  // Mock unit users data
  const allUnitUsers: Record<string, any[]> = {
    UBND_HP: [
      {
        id: 1,
        username: "nguyenvantung",
        fullName: "Nguyễn Văn Tùng",
        email: "tung.nguyen@haiphong.gov.vn",
        phone: "0912345678",
        role: "Quản trị viên",
        position: "Chủ tịch UBND",
        isActive: true,
      },
      {
        id: 2,
        username: "tranthimai",
        fullName: "Trần Thị Mai",
        email: "mai.tran@haiphong.gov.vn",
        phone: "0923456789",
        role: "Quản lý",
        position: "Chánh Văn phòng",
        isActive: true,
      },
      {
        id: 3,
        username: "levannam",
        fullName: "Lê Văn Nam",
        email: "nam.le@haiphong.gov.vn",
        phone: "0934567890",
        role: "Nhân viên",
        position: "Chuyên viên tổng hợp",
        isActive: true,
      },
      {
        id: 4,
        username: "phamthihong",
        fullName: "Phạm Thị Hồng",
        email: "hong.pham@haiphong.gov.vn",
        phone: "0945678901",
        role: "Nhân viên",
        position: "Chuyên viên hành chính",
        isActive: true,
      },
      {
        id: 5,
        username: "hoangvanminh",
        fullName: "Hoàng Văn Minh",
        email: "minh.hoang@haiphong.gov.vn",
        phone: "0956789012",
        role: "Nhân viên",
        position: "Chuyên viên pháp chế",
        isActive: true,
      },
      {
        id: 6,
        username: "dothulan",
        fullName: "Đỗ Thu Lan",
        email: "lan.do@haiphong.gov.vn",
        phone: "0967890123",
        role: "Nhân viên",
        position: "Chuyên viên văn thư",
        isActive: true,
      },
      {
        id: 7,
        username: "vuvanbinh",
        fullName: "Vũ Văn Bình",
        email: "binh.vu@haiphong.gov.vn",
        phone: "0978901234",
        role: "Quản lý",
        position: "Phó Chánh Văn phòng",
        isActive: true,
      },
      {
        id: 8,
        username: "nguyenthihue",
        fullName: "Nguyễn Thị Huệ",
        email: "hue.nguyen@haiphong.gov.vn",
        phone: "0989012345",
        role: "Nhân viên",
        position: "Chuyên viên kế hoạch",
        isActive: true,
      },
      {
        id: 9,
        username: "tranquanghai",
        fullName: "Trần Quang Hải",
        email: "hai.tran@haiphong.gov.vn",
        phone: "0990123456",
        role: "Nhân viên",
        position: "Chuyên viên tổ chức",
        isActive: false,
      },
      {
        id: 10,
        username: "lethihoa",
        fullName: "Lê Thị Hoa",
        email: "hoa.le@haiphong.gov.vn",
        phone: "0901234567",
        role: "Nhân viên",
        position: "Chuyên viên tài chính",
        isActive: true,
      },
      {
        id: 11,
        username: "phamductuan",
        fullName: "Phạm Đức Tuấn",
        email: "tuan.pham@haiphong.gov.vn",
        phone: "0913456789",
        role: "Nhân viên",
        position: "Chuyên viên công nghệ thông tin",
        isActive: true,
      },
      {
        id: 12,
        username: "ngothimy",
        fullName: "Ngô Thị Mỹ",
        email: "my.ngo@haiphong.gov.vn",
        phone: "0924567890",
        role: "Nhân viên",
        position: "Chuyên viên truyền thông",
        isActive: true,
      },
    ],
    STC: [
      {
        id: 10,
        username: "tranthimai",
        fullName: "Trần Thị Mai",
        email: "mai.tran@sotaichinh.haiphong.gov.vn",
        phone: "0923456789",
        role: "Quản lý",
        position: "Giám đốc Sở",
        isActive: true,
      },
      {
        id: 11,
        username: "phamvanhoa",
        fullName: "Phạm Văn Hòa",
        email: "hoa.pham@sotaichinh.haiphong.gov.vn",
        phone: "0987654321",
        role: "Quản lý",
        position: "Trưởng phòng Kế toán",
        isActive: true,
      },
      {
        id: 12,
        username: "nguyenvanhai",
        fullName: "Nguyễn Văn Hải",
        email: "hai.nguyen@sotaichinh.haiphong.gov.vn",
        phone: "0934567891",
        role: "Quản lý",
        position: "Phó Giám đốc Sở",
        isActive: true,
      },
      {
        id: 13,
        username: "levanthanh",
        fullName: "Lê Văn Thành",
        email: "thanh.le@sotaichinh.haiphong.gov.vn",
        phone: "0945678902",
        role: "Nhân viên",
        position: "Chuyên viên ngân sách",
        isActive: true,
      },
      {
        id: 14,
        username: "tranthilinh",
        fullName: "Trần Thị Linh",
        email: "linh.tran@sotaichinh.haiphong.gov.vn",
        phone: "0956789013",
        role: "Nhân viên",
        position: "Chuyên viên tài chính",
        isActive: true,
      },
      {
        id: 15,
        username: "phamquochung",
        fullName: "Phạm Quốc Hùng",
        email: "hung.pham@sotaichinh.haiphong.gov.vn",
        phone: "0967890124",
        role: "Nhân viên",
        position: "Chuyên viên kế toán",
        isActive: true,
      },
      {
        id: 16,
        username: "vuthimai",
        fullName: "Vũ Thị Mai",
        email: "mai.vu@sotaichinh.haiphong.gov.vn",
        phone: "0978901235",
        role: "Nhân viên",
        position: "Chuyên viên thuế",
        isActive: true,
      },
      {
        id: 17,
        username: "hoangvanson",
        fullName: "Hoàng Văn Sơn",
        email: "son.hoang@sotaichinh.haiphong.gov.vn",
        phone: "0989012346",
        role: "Nhân viên",
        position: "Chuyên viên kiểm toán",
        isActive: true,
      },
      {
        id: 18,
        username: "dothiha",
        fullName: "Đỗ Thị Hà",
        email: "ha.do@sotaichinh.haiphong.gov.vn",
        phone: "0990123457",
        role: "Nhân viên",
        position: "Chuyên viên phân tích",
        isActive: false,
      },
      {
        id: 19,
        username: "nguyenducminh",
        fullName: "Nguyễn Đức Minh",
        email: "minh.nguyen@sotaichinh.haiphong.gov.vn",
        phone: "0901234568",
        role: "Nhân viên",
        position: "Chuyên viên đầu tư",
        isActive: true,
      },
    ],
    PKT: [
      {
        id: 13,
        username: "phamvanhoa",
        fullName: "Phạm Văn Hòa",
        email: "hoa.pham@sotaichinh.haiphong.gov.vn",
        phone: "0987654321",
        role: "Quản lý",
        position: "Trưởng phòng",
        isActive: true,
      },
      {
        id: 14,
        username: "nguyenthilan",
        fullName: "Nguyễn Thị Lan",
        email: "lan.nguyen@sotaichinh.haiphong.gov.vn",
        phone: "0965432109",
        role: "Nhân viên",
        position: "Kế toán trưởng",
        isActive: true,
      },
      {
        id: 15,
        username: "leducthang",
        fullName: "Lê Đức Thắng",
        email: "thang.le@sotaichinh.haiphong.gov.vn",
        phone: "0976543210",
        role: "Nhân viên",
        position: "Kế toán viên",
        isActive: true,
      },
      {
        id: 16,
        username: "tranminhhieu",
        fullName: "Trần Minh Hiếu",
        email: "hieu.tran@sotaichinh.haiphong.gov.vn",
        phone: "0987654322",
        role: "Nhân viên",
        position: "Kế toán thanh toán",
        isActive: true,
      },
      {
        id: 17,
        username: "phamthiphuong",
        fullName: "Phạm Thị Phượng",
        email: "phuong.pham@sotaichinh.haiphong.gov.vn",
        phone: "0998765432",
        role: "Nhân viên",
        position: "Kế toán công nợ",
        isActive: true,
      },
      {
        id: 18,
        username: "nguyenvandung",
        fullName: "Nguyễn Văn Dũng",
        email: "dung.nguyen@sotaichinh.haiphong.gov.vn",
        phone: "0909876543",
        role: "Nhân viên",
        position: "Kế toán tài sản",
        isActive: true,
      },
      {
        id: 19,
        username: "vuthilan",
        fullName: "Vũ Thị Lan",
        email: "lan.vu@sotaichinh.haiphong.gov.vn",
        phone: "0920987654",
        role: "Nhân viên",
        position: "Kế toán vật tư",
        isActive: true,
      },
      {
        id: 20,
        username: "hoangquyet",
        fullName: "Hoàng Quyết",
        email: "quyet.hoang@sotaichinh.haiphong.gov.vn",
        phone: "0931098765",
        role: "Quản lý",
        position: "Phó Trưởng phòng",
        isActive: true,
      },
    ],
    PNS: [
      {
        id: 21,
        username: "lethihuong",
        fullName: "Lê Thị Hương",
        email: "huong.le@sotaichinh.haiphong.gov.vn",
        phone: "0942109876",
        role: "Quản lý",
        position: "Trưởng phòng",
        isActive: true,
      },
      {
        id: 22,
        username: "vuvannam",
        fullName: "Vũ Văn Nam",
        email: "nam.vu@sotaichinh.haiphong.gov.vn",
        phone: "0953210987",
        role: "Quản lý",
        position: "Phó Trưởng phòng",
        isActive: true,
      },
      {
        id: 23,
        username: "nguyenthithao",
        fullName: "Nguyễn Thị Thảo",
        email: "thao.nguyen@sotaichinh.haiphong.gov.vn",
        phone: "0964321098",
        role: "Nhân viên",
        position: "Chuyên viên ngân sách",
        isActive: true,
      },
      {
        id: 24,
        username: "tranvanhoang",
        fullName: "Trần Văn Hoàng",
        email: "hoang.tran@sotaichinh.haiphong.gov.vn",
        phone: "0975432109",
        role: "Nhân viên",
        position: "Chuyên viên dự toán",
        isActive: true,
      },
      {
        id: 25,
        username: "phamthihang",
        fullName: "Phạm Thị Hằng",
        email: "hang.pham@sotaichinh.haiphong.gov.vn",
        phone: "0986543210",
        role: "Nhân viên",
        position: "Chuyên viên quyết toán",
        isActive: true,
      },
      {
        id: 26,
        username: "levanquang",
        fullName: "Lê Văn Quang",
        email: "quang.le@sotaichinh.haiphong.gov.vn",
        phone: "0997654321",
        role: "Nhân viên",
        position: "Chuyên viên phân bổ",
        isActive: true,
      },
      {
        id: 27,
        username: "ngothithu",
        fullName: "Ngô Thị Thu",
        email: "thu.ngo@sotaichinh.haiphong.gov.vn",
        phone: "0908765432",
        role: "Nhân viên",
        position: "Chuyên viên giám sát",
        isActive: false,
      },
      {
        id: 28,
        username: "dovanhai",
        fullName: "Đỗ Văn Hải",
        email: "hai.do@sotaichinh.haiphong.gov.vn",
        phone: "0919876543",
        role: "Nhân viên",
        position: "Chuyên viên tổng hợp",
        isActive: true,
      },
    ],
    SKHDT: [
      {
        id: 30,
        username: "hoangvanminh",
        fullName: "Hoàng Văn Minh",
        email: "minh.hoang@sokehoach.haiphong.gov.vn",
        phone: "0930987654",
        role: "Quản lý",
        position: "Giám đốc Sở",
        isActive: true,
      },
      {
        id: 31,
        username: "dothilan",
        fullName: "Đỗ Thị Lan",
        email: "lan.do@sokehoach.haiphong.gov.vn",
        phone: "0941098765",
        role: "Quản lý",
        position: "Phó Giám đốc Sở",
        isActive: true,
      },
      {
        id: 32,
        username: "tranvanbinh",
        fullName: "Trần Văn Bình",
        email: "binh.tran@sokehoach.haiphong.gov.vn",
        phone: "0952109876",
        role: "Nhân viên",
        position: "Chuyên viên kế hoạch",
        isActive: true,
      },
      {
        id: 33,
        username: "nguyenthihuong",
        fullName: "Nguyễn Thị Hương",
        email: "huong.nguyen@sokehoach.haiphong.gov.vn",
        phone: "0963210987",
        role: "Nhân viên",
        position: "Chuyên viên đầu tư",
        isActive: true,
      },
      {
        id: 34,
        username: "phamvanquan",
        fullName: "Phạm Văn Quân",
        email: "quan.pham@sokehoach.haiphong.gov.vn",
        phone: "0974321098",
        role: "Nhân viên",
        position: "Chuyên viên thống kê",
        isActive: true,
      },
      {
        id: 35,
        username: "lethinha",
        fullName: "Lê Thị Nhã",
        email: "nha.le@sokehoach.haiphong.gov.vn",
        phone: "0985432109",
        role: "Nhân viên",
        position: "Chuyên viên phát triển",
        isActive: true,
      },
      {
        id: 36,
        username: "vuvanduc",
        fullName: "Vũ Văn Đức",
        email: "duc.vu@sokehoach.haiphong.gov.vn",
        phone: "0996543210",
        role: "Nhân viên",
        position: "Chuyên viên quy hoạch",
        isActive: true,
      },
      {
        id: 37,
        username: "hoangthithuy",
        fullName: "Hoàng Thị Thủy",
        email: "thuy.hoang@sokehoach.haiphong.gov.vn",
        phone: "0907654321",
        role: "Nhân viên",
        position: "Chuyên viên tổng hợp",
        isActive: true,
      },
      {
        id: 38,
        username: "tranducmanh",
        fullName: "Trần Đức Mạnh",
        email: "manh.tran@sokehoach.haiphong.gov.vn",
        phone: "0918765432",
        role: "Nhân viên",
        position: "Chuyên viên phân tích",
        isActive: false,
      },
      {
        id: 39,
        username: "nguyenvanlong",
        fullName: "Nguyễn Văn Long",
        email: "long.nguyen@sokehoach.haiphong.gov.vn",
        phone: "0929876543",
        role: "Nhân viên",
        position: "Chuyên viên dự án",
        isActive: true,
      },
    ],
    PKH: [
      {
        id: 40,
        username: "nguyenvanhoang",
        fullName: "Nguyễn Văn Hoàng",
        email: "hoang.nguyen@sokehoach.haiphong.gov.vn",
        phone: "0940987655",
        role: "Quản lý",
        position: "Trưởng phòng",
        isActive: true,
      },
      {
        id: 41,
        username: "lethiha",
        fullName: "Lê Thị Hà",
        email: "ha.le@sokehoach.haiphong.gov.vn",
        phone: "0951098766",
        role: "Quản lý",
        position: "Phó Trưởng phòng",
        isActive: true,
      },
      {
        id: 42,
        username: "phamvanlinh",
        fullName: "Phạm Văn Linh",
        email: "linh.pham@sokehoach.haiphong.gov.vn",
        phone: "0962109877",
        role: "Nhân viên",
        position: "Chuyên viên kế hoạch kinh tế",
        isActive: true,
      },
      {
        id: 43,
        username: "tranthingoc",
        fullName: "Trần Thị Ngọc",
        email: "ngoc.tran@sokehoach.haiphong.gov.vn",
        phone: "0973210988",
        role: "Nhân viên",
        position: "Chuyên viên kế hoạch xã hội",
        isActive: true,
      },
      {
        id: 44,
        username: "nguyenvantien",
        fullName: "Nguyễn Văn Tiến",
        email: "tien.nguyen@sokehoach.haiphong.gov.vn",
        phone: "0984321099",
        role: "Nhân viên",
        position: "Chuyên viên tổng hợp kế hoạch",
        isActive: true,
      },
      {
        id: 45,
        username: "vuvantuong",
        fullName: "Vũ Văn Tưởng",
        email: "tuong.vu@sokehoach.haiphong.gov.vn",
        phone: "0995432100",
        role: "Nhân viên",
        position: "Chuyên viên giám sát kế hoạch",
        isActive: true,
      },
    ],
    PDT: [
      {
        id: 46,
        username: "tranvanduc",
        fullName: "Trần Văn Đức",
        email: "duc.tran@sokehoach.haiphong.gov.vn",
        phone: "0906543211",
        role: "Quản lý",
        position: "Trưởng phòng",
        isActive: true,
      },
      {
        id: 47,
        username: "phamthinga",
        fullName: "Phạm Thị Nga",
        email: "nga.pham@sokehoach.haiphong.gov.vn",
        phone: "0917654322",
        role: "Quản lý",
        position: "Phó Trưởng phòng",
        isActive: true,
      },
      {
        id: 48,
        username: "nguyenthitam",
        fullName: "Nguyễn Thị Tâm",
        email: "tam.nguyen@sokehoach.haiphong.gov.vn",
        phone: "0928765433",
        role: "Nhân viên",
        position: "Chuyên viên thẩm định",
        isActive: true,
      },
      {
        id: 49,
        username: "levankien",
        fullName: "Lê Văn Kiên",
        email: "kien.le@sokehoach.haiphong.gov.vn",
        phone: "0939876544",
        role: "Nhân viên",
        position: "Chuyên viên đầu tư công",
        isActive: true,
      },
      {
        id: 50,
        username: "hoangvancuong",
        fullName: "Hoàng Văn Cường",
        email: "cuong.hoang@sokehoach.haiphong.gov.vn",
        phone: "0950987655",
        role: "Nhân viên",
        position: "Chuyên viên đầu tư tư nhân",
        isActive: true,
      },
      {
        id: 51,
        username: "dothibich",
        fullName: "Đỗ Thị Bích",
        email: "bich.do@sokehoach.haiphong.gov.vn",
        phone: "0961098766",
        role: "Nhân viên",
        position: "Chuyên viên giám sát đầu tư",
        isActive: false,
      },
      {
        id: 52,
        username: "tranvanphuc",
        fullName: "Trần Văn Phúc",
        email: "phuc.tran@sokehoach.haiphong.gov.vn",
        phone: "0972109877",
        role: "Nhân viên",
        position: "Chuyên viên FDI",
        isActive: true,
      },
    ],
    SXD: [
      {
        id: 53,
        username: "levanquang",
        fullName: "Lê Văn Quang",
        email: "quang.le@soxaydung.haiphong.gov.vn",
        phone: "0983210988",
        role: "Quản lý",
        position: "Giám đốc Sở",
        isActive: true,
      },
      {
        id: 54,
        username: "nguyenthithu",
        fullName: "Nguyễn Thị Thu",
        email: "thu.nguyen@soxaydung.haiphong.gov.vn",
        phone: "0994321099",
        role: "Quản lý",
        position: "Phó Giám đốc Sở",
        isActive: true,
      },
      {
        id: 55,
        username: "phamvanhung",
        fullName: "Phạm Văn Hùng",
        email: "hung.pham@soxaydung.haiphong.gov.vn",
        phone: "0905432100",
        role: "Nhân viên",
        position: "Chuyên viên quy hoạch",
        isActive: true,
      },
      {
        id: 56,
        username: "tranthilanh",
        fullName: "Trần Thị Lành",
        email: "lanh.tran@soxaydung.haiphong.gov.vn",
        phone: "0916543211",
        role: "Nhân viên",
        position: "Chuyên viên kiến trúc",
        isActive: true,
      },
      {
        id: 57,
        username: "nguyenvantoan",
        fullName: "Nguyễn Văn Toàn",
        email: "toan.nguyen@soxaydung.haiphong.gov.vn",
        phone: "0927654322",
        role: "Nhân viên",
        position: "Chuyên viên kỹ thuật",
        isActive: true,
      },
      {
        id: 58,
        username: "lethiphuong",
        fullName: "Lê Thị Phương",
        email: "phuong.le@soxaydung.haiphong.gov.vn",
        phone: "0938765433",
        role: "Nhân viên",
        position: "Chuyên viên cấp phép",
        isActive: true,
      },
      {
        id: 59,
        username: "vuvantrung",
        fullName: "Vũ Văn Trung",
        email: "trung.vu@soxaydung.haiphong.gov.vn",
        phone: "0949876544",
        role: "Nhân viên",
        position: "Chuyên viên quản lý dự án",
        isActive: true,
      },
      {
        id: 60,
        username: "hoangthihang",
        fullName: "Hoàng Thị Hằng",
        email: "hang.hoang@soxaydung.haiphong.gov.vn",
        phone: "0960987655",
        role: "Nhân viên",
        position: "Chuyên viên giám sát",
        isActive: true,
      },
    ],
    SGTVT: [
      {
        id: 61,
        username: "phamquochung",
        fullName: "Phạm Quốc Hùng",
        email: "hung.pham@sogiaothong.haiphong.gov.vn",
        phone: "0971098766",
        role: "Quản lý",
        position: "Giám đốc Sở",
        isActive: true,
      },
      {
        id: 62,
        username: "vuthilinh",
        fullName: "Vũ Thị Linh",
        email: "linh.vu@sogiaothong.haiphong.gov.vn",
        phone: "0982109877",
        role: "Quản lý",
        position: "Phó Giám đốc Sở",
        isActive: true,
      },
      {
        id: 63,
        username: "nguyenvanphong",
        fullName: "Nguyễn Văn Phong",
        email: "phong.nguyen@sogiaothong.haiphong.gov.vn",
        phone: "0993210988",
        role: "Nhân viên",
        position: "Chuyên viên hạ tầng",
        isActive: true,
      },
      {
        id: 64,
        username: "tranthiloan",
        fullName: "Trần Thị Loan",
        email: "loan.tran@sogiaothong.haiphong.gov.vn",
        phone: "0904321099",
        role: "Nhân viên",
        position: "Chuyên viên vận tải",
        isActive: true,
      },
      {
        id: 65,
        username: "levansy",
        fullName: "Lê Văn Sỹ",
        email: "sy.le@sogiaothong.haiphong.gov.vn",
        phone: "0915432100",
        role: "Nhân viên",
        position: "Chuyên viên an toàn giao thông",
        isActive: true,
      },
      {
        id: 66,
        username: "phamthilien",
        fullName: "Phạm Thị Liên",
        email: "lien.pham@sogiaothong.haiphong.gov.vn",
        phone: "0926543211",
        role: "Nhân viên",
        position: "Chuyên viên đường bộ",
        isActive: true,
      },
      {
        id: 67,
        username: "hoangvantuan",
        fullName: "Hoàng Văn Tuấn",
        email: "tuan.hoang@sogiaothong.haiphong.gov.vn",
        phone: "0937654322",
        role: "Nhân viên",
        position: "Chuyên viên đường thủy",
        isActive: false,
      },
      {
        id: 68,
        username: "nguyenthihuyen",
        fullName: "Nguyễn Thị Huyền",
        email: "huyen.nguyen@sogiaothong.haiphong.gov.vn",
        phone: "0948765433",
        role: "Nhân viên",
        position: "Chuyên viên quy hoạch giao thông",
        isActive: true,
      },
    ],
    SNNPTNT: [
      {
        id: 69,
        username: "dovanthang",
        fullName: "Đỗ Văn Thắng",
        email: "thang.do@sonongnghiep.haiphong.gov.vn",
        phone: "0959876544",
        role: "Quản lý",
        position: "Giám đốc Sở",
        isActive: true,
      },
      {
        id: 70,
        username: "hoangthimai",
        fullName: "Hoàng Thị Mai",
        email: "mai.hoang@sonongnghiep.haiphong.gov.vn",
        phone: "0970987655",
        role: "Quản lý",
        position: "Phó Giám đốc Sở",
        isActive: true,
      },
      {
        id: 71,
        username: "tranvannam",
        fullName: "Trần Văn Nam",
        email: "nam.tran@sonongnghiep.haiphong.gov.vn",
        phone: "0981098766",
        role: "Nhân viên",
        position: "Chuyên viên trồng trọt",
        isActive: true,
      },
      {
        id: 72,
        username: "nguyenthihoa",
        fullName: "Nguyễn Thị Hoa",
        email: "hoa.nguyen@sonongnghiep.haiphong.gov.vn",
        phone: "0992109877",
        role: "Nhân viên",
        position: "Chuyên viên chăn nuôi",
        isActive: true,
      },
      {
        id: 73,
        username: "phamvandung",
        fullName: "Phạm Văn Dũng",
        email: "dung.pham@sonongnghiep.haiphong.gov.vn",
        phone: "0903210988",
        role: "Nhân viên",
        position: "Chuyên viên thủy sản",
        isActive: true,
      },
      {
        id: 74,
        username: "lethithuong",
        fullName: "Lê Thị Thương",
        email: "thuong.le@sonongnghiep.haiphong.gov.vn",
        phone: "0914321099",
        role: "Nhân viên",
        position: "Chuyên viên lâm nghiệp",
        isActive: true,
      },
      {
        id: 75,
        username: "vuvanhieu",
        fullName: "Vũ Văn Hiếu",
        email: "hieu.vu@sonongnghiep.haiphong.gov.vn",
        phone: "0925432100",
        role: "Nhân viên",
        position: "Chuyên viên khuyến nông",
        isActive: true,
      },
      {
        id: 76,
        username: "hoangthingoc",
        fullName: "Hoàng Thị Ngọc",
        email: "ngoc.hoang@sonongnghiep.haiphong.gov.vn",
        phone: "0936543211",
        role: "Nhân viên",
        position: "Chuyên viên nông thôn mới",
        isActive: true,
      },
    ],
    SCT: [
      {
        id: 77,
        username: "nguyenducmanh",
        fullName: "Nguyễn Đức Mạnh",
        email: "manh.nguyen@socongth Hang@haiphong.gov.vn",
        phone: "0947654322",
        role: "Quản lý",
        position: "Giám đốc Sở",
        isActive: true,
      },
      {
        id: 78,
        username: "tranvanbinh",
        fullName: "Trần Văn Bình",
        email: "binh.tran@socongth Hang@haiphong.gov.vn",
        phone: "0958765433",
        role: "Quản lý",
        position: "Phó Giám đốc Sở",
        isActive: true,
      },
      {
        id: 79,
        username: "lethiquynh",
        fullName: "Lê Thị Quỳnh",
        email: "quynh.le@socongth Hang@haiphong.gov.vn",
        phone: "0969876544",
        role: "Nhân viên",
        position: "Chuyên viên công nghiệp",
        isActive: true,
      },
      {
        id: 80,
        username: "phamvanthanh",
        fullName: "Phạm Văn Thành",
        email: "thanh.pham@socongth Hang@haiphong.gov.vn",
        phone: "0980987655",
        role: "Nhân viên",
        position: "Chuyên viên thương mại",
        isActive: true,
      },
      {
        id: 81,
        username: "nguyenthimai",
        fullName: "Nguyễn Thị Mai",
        email: "mai.nguyen@socongth Hang@haiphong.gov.vn",
        phone: "0991098766",
        role: "Nhân viên",
        position: "Chuyên viên xuất nhập khẩu",
        isActive: true,
      },
      {
        id: 82,
        username: "vuvanquan",
        fullName: "Vũ Văn Quân",
        email: "quan.vu@socongth Hang@haiphong.gov.vn",
        phone: "0902109877",
        role: "Nhân viên",
        position: "Chuyên viên năng lượng",
        isActive: false,
      },
      {
        id: 83,
        username: "hoangthihue",
        fullName: "Hoàng Thị Huệ",
        email: "hue.hoang@socongth Hang@haiphong.gov.vn",
        phone: "0913210988",
        role: "Nhân viên",
        position: "Chuyên viên an toàn thực phẩm",
        isActive: true,
      },
    ],
    SGDDT: [
      {
        id: 84,
        username: "vuthilananh",
        fullName: "Vũ Thị Lan Anh",
        email: "lananh.vu@sogiaoduc.haiphong.gov.vn",
        phone: "0924321099",
        role: "Quản lý",
        position: "Giám đốc Sở",
        isActive: true,
      },
      {
        id: 85,
        username: "dangvanhai",
        fullName: "Đặng Văn Hải",
        email: "hai.dang@sogiaoduc.haiphong.gov.vn",
        phone: "0935432100",
        role: "Quản lý",
        position: "Phó Giám đốc Sở",
        isActive: true,
      },
      {
        id: 86,
        username: "nguyenthilan",
        fullName: "Nguyễn Thị Lan",
        email: "lan.nguyen@sogiaoduc.haiphong.gov.vn",
        phone: "0946543211",
        role: "Nhân viên",
        position: "Chuyên viên giáo dục mầm non",
        isActive: true,
      },
      {
        id: 87,
        username: "tranvanhung",
        fullName: "Trần Văn Hùng",
        email: "hung.tran@sogiaoduc.haiphong.gov.vn",
        phone: "0957654322",
        role: "Nhân viên",
        position: "Chuyên viên giáo dục phổ thông",
        isActive: true,
      },
      {
        id: 88,
        username: "lethihuong",
        fullName: "Lê Thị Hương",
        email: "huong.le@sogiaoduc.haiphong.gov.vn",
        phone: "0968765433",
        role: "Nhân viên",
        position: "Chuyên viên giáo dục thường xuyên",
        isActive: true,
      },
      {
        id: 89,
        username: "phamvanminh",
        fullName: "Phạm Văn Minh",
        email: "minh.pham@sogiaoduc.haiphong.gov.vn",
        phone: "0979876544",
        role: "Nhân viên",
        position: "Chuyên viên quản lý chất lượng",
        isActive: true,
      },
      {
        id: 90,
        username: "hoangthithu",
        fullName: "Hoàng Thị Thu",
        email: "thu.hoang@sogiaoduc.haiphong.gov.vn",
        phone: "0990987655",
        role: "Nhân viên",
        position: "Chuyên viên thi và kiểm định",
        isActive: true,
      },
    ],
    SYT: [
      {
        id: 91,
        username: "leminhtuan",
        fullName: "BS. Lê Minh Tuấn",
        email: "tuan.le@soyte.haiphong.gov.vn",
        phone: "0901098766",
        role: "Quản lý",
        position: "Giám đốc Sở",
        isActive: true,
      },
      {
        id: 92,
        username: "nguyenthihong",
        fullName: "BS. Nguyễn Thị Hồng",
        email: "hong.nguyen@soyte.haiphong.gov.vn",
        phone: "0912109877",
        role: "Quản lý",
        position: "Phó Giám đốc Sở",
        isActive: true,
      },
      {
        id: 93,
        username: "tranvannam",
        fullName: "BS. Trần Văn Nam",
        email: "nam.tran@soyte.haiphong.gov.vn",
        phone: "0923210988",
        role: "Nhân viên",
        position: "Chuyên viên y tế dự phòng",
        isActive: true,
      },
      {
        id: 94,
        username: "phamthimai",
        fullName: "Dược sĩ Phạm Thị Mai",
        email: "mai.pham@soyte.haiphong.gov.vn",
        phone: "0934321099",
        role: "Nhân viên",
        position: "Chuyên viên dược",
        isActive: true,
      },
      {
        id: 95,
        username: "levanhung",
        fullName: "ThS. Lê Văn Hùng",
        email: "hung.le@soyte.haiphong.gov.vn",
        phone: "0945432100",
        role: "Nhân viên",
        position: "Chuyên viên khám chữa bệnh",
        isActive: true,
      },
      {
        id: 96,
        username: "nguyenthiha",
        fullName: "CN. Nguyễn Thị Hà",
        email: "ha.nguyen@soyte.haiphong.gov.vn",
        phone: "0956543211",
        role: "Nhân viên",
        position: "Chuyên viên điều dưỡng",
        isActive: true,
      },
      {
        id: 97,
        username: "hoangvanquang",
        fullName: "BS. Hoàng Văn Quang",
        email: "quang.hoang@soyte.haiphong.gov.vn",
        phone: "0967654322",
        role: "Nhân viên",
        position: "Chuyên viên y tế học đường",
        isActive: false,
      },
      {
        id: 98,
        username: "vuthiloan",
        fullName: "BS. Vũ Thị Loan",
        email: "loan.vu@soyte.haiphong.gov.vn",
        phone: "0978765433",
        role: "Nhân viên",
        position: "Chuyên viên sức khỏe sinh sản",
        isActive: true,
      },
    ],
    SVHTT: [
      {
        id: 99,
        username: "phamthihuong",
        fullName: "Phạm Thị Hương",
        email: "huong.pham@sovanhoa.haiphong.gov.vn",
        phone: "0989876544",
        role: "Quản lý",
        position: "Giám đốc Sở",
        isActive: true,
      },
      {
        id: 100,
        username: "levankien",
        fullName: "Lê Văn Kiên",
        email: "kien.le@sovanhoa.haiphong.gov.vn",
        phone: "0990987655",
        role: "Quản lý",
        position: "Phó Giám đốc Sở",
        isActive: true,
      },
      {
        id: 101,
        username: "nguyenthingoc",
        fullName: "Nguyễn Thị Ngọc",
        email: "ngoc.nguyen@sovanhoa.haiphong.gov.vn",
        phone: "0901098767",
        role: "Nhân viên",
        position: "Chuyên viên văn hóa",
        isActive: true,
      },
      {
        id: 102,
        username: "tranvanphuc",
        fullName: "Trần Văn Phúc",
        email: "phuc.tran@sovanhoa.haiphong.gov.vn",
        phone: "0912109878",
        role: "Nhân viên",
        position: "Chuyên viên thể thao",
        isActive: true,
      },
      {
        id: 103,
        username: "hoangthilan",
        fullName: "Hoàng Thị Lan",
        email: "lan.hoang@sovanhoa.haiphong.gov.vn",
        phone: "0923210989",
        role: "Nhân viên",
        position: "Chuyên viên nghệ thuật",
        isActive: true,
      },
      {
        id: 104,
        username: "phamvanduc",
        fullName: "Phạm Văn Đức",
        email: "duc.pham@sovanhoa.haiphong.gov.vn",
        phone: "0934321090",
        role: "Nhân viên",
        position: "Chuyên viên di sản",
        isActive: true,
      },
      {
        id: 105,
        username: "lethithu",
        fullName: "Lê Thị Thu",
        email: "thu.le@sovanhoa.haiphong.gov.vn",
        phone: "0945432101",
        role: "Nhân viên",
        position: "Chuyên viên du lịch",
        isActive: true,
      },
    ],
    SKHCN: [
      {
        id: 106,
        username: "nguyenvanhung",
        fullName: "TS. Nguyễn Văn Hùng",
        email: "hung.nguyen@sokhoahoc.haiphong.gov.vn",
        phone: "0956543212",
        role: "Quản lý",
        position: "Giám đốc Sở",
        isActive: true,
      },
      {
        id: 107,
        username: "tranthinhung",
        fullName: "ThS. Trần Thị Nhung",
        email: "nhung.tran@sokhoahoc.haiphong.gov.vn",
        phone: "0967654323",
        role: "Quản lý",
        position: "Phó Giám đốc Sở",
        isActive: true,
      },
      {
        id: 108,
        username: "phamvanminh",
        fullName: "KS. Phạm Văn Minh",
        email: "minh.pham@sokhoahoc.haiphong.gov.vn",
        phone: "0978765434",
        role: "Nhân viên",
        position: "Chuyên viên khoa học",
        isActive: true,
      },
      {
        id: 109,
        username: "hoangthiloan",
        fullName: "ThS. Hoàng Thị Loan",
        email: "loan.hoang@sokhoahoc.haiphong.gov.vn",
        phone: "0989876545",
        role: "Nhân viên",
        position: "Chuyên viên công nghệ",
        isActive: true,
      },
      {
        id: 110,
        username: "levandung",
        fullName: "KS. Lê Văn Dũng",
        email: "dung.le@sokhoahoc.haiphong.gov.vn",
        phone: "0990987656",
        role: "Nhân viên",
        position: "Chuyên viên chuyển giao công nghệ",
        isActive: true,
      },
      {
        id: 111,
        username: "nguyenthiha",
        fullName: "Nguyễn Thị Hà",
        email: "ha.nguyen@sokhoahoc.haiphong.gov.vn",
        phone: "0901098768",
        role: "Nhân viên",
        position: "Chuyên viên sở hữu trí tuệ",
        isActive: true,
      },
    ],
  };

  // Auto-select first unit on mount
  useEffect(() => {
    // Select root node and show its detail
    const rootNode = treeData[0];
    if (rootNode && rootNode.code) {
      setSelectedTreeNode(rootNode.id);
      setSelectedUnitId(rootNode.code);
      setIsPanelOpen(true);
      setActiveTab("info");
    }
  }, []); // Empty dependency array = run once on mount

  // Filter units
  const filteredUnits = allUnits.filter((unit) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        unit.name.toLowerCase().includes(query) ||
        unit.code.toLowerCase().includes(query) ||
        unit.address.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus !== "all") {
      if (filterStatus === "active" && !unit.isActive)
        return false;
      if (filterStatus === "inactive" && unit.isActive)
        return false;
    }

    return true;
  });

  const totalItems = filteredUnits.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const units = filteredUnits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Tree functions
  const toggleTreeNode = (
    nodeId: string,
    nodes: TreeNode[],
  ): TreeNode[] => {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, isExpanded: !node.isExpanded };
      }
      if (node.children) {
        return {
          ...node,
          children: toggleTreeNode(nodeId, node.children),
        };
      }
      return node;
    });
  };

  const handleTreeNodeClick = (nodeId: string) => {
    setSelectedTreeNode(nodeId);
    // Find node code to open detail
    const node = findNodeById(treeData, nodeId);
    if (node && node.code) {
      handleViewDetails(node.code);
    }
  };

  const handleTreeNodeToggle = (nodeId: string) => {
    setTreeData(toggleTreeNode(nodeId, treeData));
  };

  const renderTreeNode = (node: TreeNode) => {
    const isSelected = selectedTreeNode === node.id;
    const hasChildren =
      node.children && node.children.length > 0;
    const paddingLeft = node.level * 20 + 12;

    return (
      <div key={node.id}>
        <motion.div
          className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-l-4 ${
            isSelected
              ? "bg-gradient-to-r from-[#C8102E]/10 to-[#A90F14]/10 text-[#C8102E] font-semibold border-[#C8102E]"
              : "text-gray-700 hover:bg-gray-50 border-transparent"
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => handleTreeNodeClick(node.id)}
          initial={false}
          animate={{
            backgroundColor: isSelected ? "rgba(200, 16, 46, 0.05)" : "rgba(255, 255, 255, 0)",
          }}
          transition={{ duration: 0.2 }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTreeNodeToggle(node.id);
              }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              {node.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <Building2
            className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-[#C8102E]" : "text-gray-400"}`}
          />
          <span className="text-sm truncate flex-1">
            {node.name}
          </span>
        </motion.div>
        {hasChildren && node.isExpanded && (
          <div>
            {node.children!.map((child) =>
              renderTreeNode(child),
            )}
          </div>
        )}
      </div>
    );
  };

  const toggleSelectAll = () => {
    if (selectedUnits.length === units.length) {
      setSelectedUnits([]);
    } else {
      setSelectedUnits(units.map((u) => u.id));
    }
  };

  const toggleSelectUnit = (unitId: number) => {
    if (selectedUnits.includes(unitId)) {
      setSelectedUnits(
        selectedUnits.filter((id) => id !== unitId),
      );
    } else {
      setSelectedUnits([...selectedUnits, unitId]);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const activeUnits = filteredUnits.filter(
    (u) => u.isActive,
  ).length;

  const resetFilters = () => {
    setFilterStatus("all");
    setSearchQuery("");
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (filterStatus !== "all") count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const getActiveFilterTags = () => {
    const tags: Array<{ label: string; onRemove: () => void }> =
      [];
    if (searchQuery) {
      tags.push({
        label: `Tìm kiếm: "${searchQuery}"`,
        onRemove: () => setSearchQuery(""),
      });
    }
    if (filterStatus !== "all") {
      tags.push({
        label: `Trạng thái: ${filterStatus === "active" ? "Hoạt động" : "Ngừng hoạt động"}`,
        onRemove: () => setFilterStatus("all"),
      });
    }
    return tags;
  };

  // Get selected node info
  const findNodeById = (
    nodes: TreeNode[],
    id: string,
  ): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const findNodeByCode = (
    nodes: TreeNode[],
    code: string,
  ): TreeNode | null => {
    for (const node of nodes) {
      if (node.code === code) return node;
      if (node.children) {
        const found = findNodeByCode(node.children, code);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = findNodeById(treeData, selectedTreeNode);

  // Handler to open detail panel
  const handleViewDetails = (unitCode: string) => {
    setIsLoadingDetail(true);
    setSelectedUnitId(unitCode);
    setIsPanelOpen(true);
    setActiveTab("info"); // Reset to info tab when opening

    // Simulate loading for smooth transition
    setTimeout(() => {
      setIsLoadingDetail(false);
    }, 200);
  };

  // Handler to close detail panel
  const handleClosePanel = () => {
    setIsPanelOpen(false);
    // Delay clearing selected unit to allow animation to complete
    setTimeout(() => setSelectedUnitId(null), 300);
  };

  // Get current unit details
  const currentUnitDetails = selectedUnitId
    ? unitDetailsDatabase[selectedUnitId]
    : null;

  // Get child units from tree data
  const getChildUnitsFromTree = (unitId: string | null): any[] => {
    if (!unitId) return [];

    const node = findNodeByCode(treeData, unitId);
    if (!node || !node.children) return [];

    return node.children.map((child, index) => {
      // Try to parse id as number, fallback to hash of id string
      let numericId: number;
      const parsedId = parseInt(child.id);
      if (!isNaN(parsedId)) {
        numericId = parsedId;
      } else {
        // Create a simple hash from string id
        numericId = child.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      }

      return {
        id: numericId,
        name: child.name,
        code: child.code,
        address: '', // TODO: Get from database
        phone: '',
        totalMembers: 0,
        isActive: true,
      };
    });
  };

  const currentChildUnits = getChildUnitsFromTree(selectedUnitId);
  const currentUnitUsers = selectedUnitId
    ? allUnitUsers[selectedUnitId] || []
    : [];

  const selectedDetailNode = findNodeByCode(treeData, selectedUnitId || 'UBND_HP');
  const level = selectedDetailNode?.level || 0;

  let infoLabel = "Thông tin đơn vị";
  let childrenLabel = "Đơn vị trực thuộc";
  let childUnitTypeLabel = "đơn vị trực thuộc";

  if (level === 1) {
    infoLabel = "Thông tin sở";
    childrenLabel = "Phòng ban trực thuộc";
    childUnitTypeLabel = "phòng ban trực thuộc";
  } else if (level >= 2) {
    infoLabel = "Thông tin phòng ban";
    childrenLabel = "Bộ phận trực thuộc";
    childUnitTypeLabel = "bộ phận trực thuộc";
  }

  // Detail panel tabs configuration
  const detailTabs = [
    {
      key: "info" as TabKey,
      label: infoLabel,
      icon: Info,
    },
    {
      key: "child-units" as TabKey,
      label: childrenLabel,
      icon: Building2,
      count: currentChildUnits.length,
    },
    {
      key: "users" as TabKey,
      label: "Danh sách nhân sự",
      icon: Users,
      count: currentUnitUsers.length,
    },
  ];

  // User modal handlers
  const handleAddUser = () => {
    setUserFormModal({
      isOpen: true,
      mode: 'create',
      defaultUnitId: selectedUnitId || undefined,
    });
  };

  const handleViewUser = (userId: number) => {
    setUserFormModal({
      isOpen: true,
      mode: 'view',
      userId,
      defaultUnitId: selectedUnitId || undefined,
    });
  };

  const handleEditUser = (userId: number) => {
    setUserFormModal({
      isOpen: true,
      mode: 'edit',
      userId,
      defaultUnitId: selectedUnitId || undefined,
    });
  };

  const handleDeleteUser = (userId: number) => {
    setDeleteUserModal({
      isOpen: true,
      userId,
    });
  };

  const handleCloseUserFormModal = () => {
    setUserFormModal({ isOpen: false, mode: 'create' });
  };

  const handleCloseDeleteUserModal = () => {
    setDeleteUserModal({ isOpen: false });
  };

  const handleSubmitUserForm = (userData: any) => {
    console.log('User form submitted:', userData);
    // TODO: Call API to create/update user

    if (userFormModal.mode === 'create') {
      toast.success('Thêm người dùng thành công', `Đã thêm người dùng ${userData.fullName} vào hệ thống`);
    } else if (userFormModal.mode === 'edit') {
      toast.success('Cập nhật người dùng thành công', `Thông tin người dùng ${userData.fullName} đã được cập nhật`);
    }

    handleCloseUserFormModal();
  };

  const handleConfirmDeleteUser = () => {
    console.log('Delete user:', deleteUserModal.userId);
    const user = currentUnitUsers.find(u => u.id === deleteUserModal.userId);

    // TODO: Call API to delete user

    if (user) {
      toast.success('Xóa người dùng thành công', `Đã xóa người dùng ${user.fullName} khỏi hệ thống`);
    }

    handleCloseDeleteUserModal();
  };

  // Helper function to add node to tree
  const addNodeToTree = (
    tree: TreeNode[],
    parentId: string,
    newNode: TreeNode
  ): TreeNode[] => {
    return tree.map(node => {
      if (node.id === parentId) {
        const updatedChildren = node.children || [];
        return {
          ...node,
          children: [...updatedChildren, newNode],
          isExpanded: true, // Auto expand parent when adding child
        };
      }
      if (node.children) {
        return {
          ...node,
          children: addNodeToTree(node.children, parentId, newNode),
        };
      }
      return node;
    });
  };

  // Helper function to update node in tree
  const updateNodeInTree = (
    tree: TreeNode[],
    nodeId: string,
    updates: Partial<TreeNode>
  ): TreeNode[] => {
    return tree.map(node => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeInTree(node.children, nodeId, updates),
        };
      }
      return node;
    });
  };

  // Helper function to delete node from tree
  const deleteNodeFromTree = (
    tree: TreeNode[],
    nodeId: string
  ): TreeNode[] => {
    return tree.reduce((acc, node) => {
      if (node.id === nodeId) {
        return acc; // Skip this node (delete it)
      }
      if (node.children) {
        return [
          ...acc,
          {
            ...node,
            children: deleteNodeFromTree(node.children, nodeId),
          },
        ];
      }
      return [...acc, node];
    }, [] as TreeNode[]);
  };

  // Unit modal handlers
  const handleOpenAddUnitModal = () => {
    console.log('Opening add unit modal, selectedUnitId:', selectedUnitId);
    setUnitFormModal({ isOpen: true, mode: 'create' });
  };

  const handleOpenEditUnitModal = (unitId: number) => {
    // Find the actual string id from tree by matching the numeric id
    const node = findNodeById(treeData, selectedUnitId || 'root');
    if (node?.children) {
      const child = node.children.find(c => {
        const parsedId = parseInt(c.id);
        if (!isNaN(parsedId)) return parsedId === unitId;
        const hashId = c.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return hashId === unitId;
      });
      if (child) {
        setUnitFormModal({ isOpen: true, mode: 'edit', unitId: child.id });
      }
    }
  };

  const handleOpenDeleteUnitModal = (unitId: number) => {
    // Find the actual string id from tree by matching the numeric id
    const node = findNodeById(treeData, selectedUnitId || 'root');
    if (node?.children) {
      const child = node.children.find(c => {
        const parsedId = parseInt(c.id);
        if (!isNaN(parsedId)) return parsedId === unitId;
        const hashId = c.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return hashId === unitId;
      });
      if (child) {
        setDeleteUnitModal({ isOpen: true, unitId: child.id });
      }
    }
  };

  const handleCloseUnitFormModal = () => {
    setUnitFormModal({ isOpen: false, mode: 'create' });
  };

  const handleCloseDeleteUnitModal = () => {
    setDeleteUnitModal({ isOpen: false });
  };

  const handleSubmitUnitForm = (unitData: any) => {
    if (unitFormModal.mode === 'create') {
      // Generate new ID
      const newId = `${selectedUnitId}-${Date.now()}`;
      const parentNode = findNodeById(treeData, selectedUnitId || 'root');
      const parentLevel = parentNode?.level ?? 0;

      // Create new tree node
      const newNode: TreeNode = {
        id: newId,
        name: unitData.name,
        code: unitData.code,
        level: parentLevel + 1,
      };

      // Update tree
      const updatedTree = addNodeToTree(treeData, selectedUnitId || 'root', newNode);
      setTreeData(updatedTree);

      toast.success('Thêm đơn vị thành công', `Đã thêm đơn vị "${unitData.name}" vào hệ thống`);
      // TODO: Call API to create unit
    } else if (unitFormModal.mode === 'edit' && unitFormModal.unitId) {
      // Update tree node
      const updatedTree = updateNodeInTree(treeData, unitFormModal.unitId, {
        name: unitData.name,
        code: unitData.code,
      });
      setTreeData(updatedTree);

      toast.success('Cập nhật đơn vị thành công', `Thông tin đơn vị "${unitData.name}" đã được cập nhật`);
      // TODO: Call API to update unit
    }

    handleCloseUnitFormModal();
  };

  const handleConfirmDeleteUnit = () => {
    if (!deleteUnitModal.unitId) return;

    // Get unit name before deleting for toast message
    const unitToDelete = findNodeById(treeData, deleteUnitModal.unitId);
    const unitName = unitToDelete?.name || 'đơn vị';

    // Remove from tree
    const updatedTree = deleteNodeFromTree(treeData, deleteUnitModal.unitId);
    setTreeData(updatedTree);

    // If deleted unit was selected, clear selection
    if (selectedUnitId === deleteUnitModal.unitId) {
      setSelectedUnitId(null);
      setIsPanelOpen(false);
      setSelectedTreeNode('root');
    }

    toast.success('Xóa đơn vị thành công', `Đã xóa đơn vị "${unitName}" khỏi hệ thống`);
    // TODO: Call API to delete unit

    handleCloseDeleteUnitModal();
  };

  // Get user for delete modal
  const userToDelete = deleteUserModal.userId
    ? currentUnitUsers.find(u => u.id === deleteUserModal.userId)
    : undefined;

  // Convert user to DeleteUserModal format
  const deleteUserData = userToDelete
    ? {
        username: userToDelete.username,
        fullName: userToDelete.fullName,
        email: userToDelete.email,
        department: currentUnitDetails?.name || '',
      }
    : undefined;

  // Get user for form modal
  const userForForm = userFormModal.userId
    ? currentUnitUsers.find(u => u.id === userFormModal.userId)
    : undefined;

  // Convert user to UserFormModal format
  const userFormData = userForForm
    ? {
        id: userForForm.id,
        username: userForForm.username,
        fullName: userForForm.fullName,
        email: userForForm.email,
        phone: userForForm.phone,
        position: userForForm.position,
        department: selectedUnitId || '',
        status: (userForForm.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
      }
    : undefined;

  // Get unit for form modal
  const unitForForm = unitFormModal.unitId
    ? findNodeById(treeData, unitFormModal.unitId)
    : undefined;

  // Convert unit to UnitFormModal format
  const unitFormData = unitForForm
    ? {
        id: unitForForm.id,
        name: unitForForm.name,
        code: unitForForm.code,
        address: '', // TODO: Get from unitDetailsDatabase
        phone: '',
        email: '',
        description: '',
      }
    : undefined;

  // Get unit for delete modal
  const unitToDelete = deleteUnitModal.unitId
    ? findNodeById(treeData, deleteUnitModal.unitId)
    : undefined;

  // Convert unit to DeleteUnitModal format
  const deleteUnitData = unitToDelete
    ? {
        name: unitToDelete.name,
        code: unitToDelete.code,
      }
    : undefined;

  return (
    <>
      <div className="bg-gray-50/50">

        <div className="p-8">
          {/* Page Header */}
          <PageHeader
            breadcrumbs={[
              { name: "Trang chủ", path: "/" },
              { name: "Quản lý người dùng", path: "/nguoi-dung" },
              { name: "Quản lý đơn vị" },
            ]}
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Tổng số đơn vị
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 text-xs text-blue-600 font-semibold">
                        (Đã lọc)
                      </span>
                    )}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {totalItems}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Đang hoạt động
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {activeUnits}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Đơn vị được chọn
                  </p>
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {selectedNode?.name || "Chưa chọn"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Split Panel Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Panel - Tree Navigation */}
            <div className="col-span-4">
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm h-[calc(100vh-28rem)] flex flex-col">
                <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-200/60 px-5 py-4 z-10">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#C8102E]" />
                    Cơ cấu tổ chức
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Chọn đơn vị để xem chi tiết
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {treeData.map((node) => renderTreeNode(node))}
                </div>
              </div>
            </div>

            {/* Right Panel - Empty State or Detail */}
            <div className="col-span-8">
              <AnimatePresence mode="wait">
                {!isPanelOpen || !currentUnitDetails ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      duration: 0.3
                    }}
                    className="bg-white rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-center"
                    style={{ minHeight: "600px" }}
                  >
                    <div className="text-center px-6 py-12">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Chọn một đơn vị để xem chi tiết
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Chọn một đơn vị từ cây tổ chức bên trái để xem thông tin chi tiết, đơn vị con và danh sách nhân sự
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      duration: 0.3
                    }}
                    className="bg-white rounded-2xl border border-gray-200/60 shadow-sm flex flex-col relative overflow-hidden"
                  >
              {/* Loading Overlay */}
              {isLoadingDetail && (
                <motion.div
                  className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
                    <p className="text-sm text-gray-600 font-medium">Đang tải...</p>
                  </div>
                </motion.div>
              )}

              {/* Panel Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white shrink-0">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C8102E] to-[#A90F14] flex items-center justify-center flex-shrink-0 shadow-md">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 truncate">
                          {currentUnitDetails.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          Mã:{" "}
                          <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            {currentUnitDetails.code}
                          </code>
                        </p>
                      </div>
                    </div>
                    {currentUnitDetails.parentName && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 pl-15">
                        <ChevronRight className="h-3 w-3" />
                        <span>
                          Trực thuộc:{" "}
                          {currentUnitDetails.parentName}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleClosePanel}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all flex-shrink-0"
                    title="Đóng"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2">
                  {detailTabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          "relative px-4 py-2.5 flex items-center gap-2 text-sm font-semibold rounded-lg transition-all",
                          isActive
                            ? "bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                        )}
                      >
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-xs font-bold",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-gray-200 text-gray-600",
                            )}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "info" && currentUnitDetails && (
                      <UnitInfoTab unit={currentUnitDetails} />
                    )}
                    {activeTab === "child-units" && (
                      <ChildUnitsTab
                        units={currentChildUnits}
                        label={childUnitTypeLabel}
                        onAdd={handleOpenAddUnitModal}
                        onEdit={handleOpenEditUnitModal}
                        onDelete={handleOpenDeleteUnitModal}
                      />
                    )}
                    {activeTab === "users" && (
                      <UnitUsersTab
                        users={currentUnitUsers}
                        onAdd={handleAddUser}
                        onView={handleViewUser}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* User Modals */}
      <UserFormModal
        isOpen={userFormModal.isOpen}
        onClose={handleCloseUserFormModal}
        onSubmit={handleSubmitUserForm}
        mode={userFormModal.mode}
        initialData={userFormData}
        defaultUnitId={userFormModal.defaultUnitId}
      />

      <DeleteUserModal
        isOpen={deleteUserModal.isOpen}
        onClose={handleCloseDeleteUserModal}
        onConfirm={handleConfirmDeleteUser}
        user={deleteUserData}
      />

      {/* Unit Modals */}
      <UnitFormModal
        isOpen={unitFormModal.isOpen}
        onClose={handleCloseUnitFormModal}
        onSubmit={handleSubmitUnitForm}
        mode={unitFormModal.mode}
        initialData={unitFormData}
        parentUnitName={currentUnitDetails?.name}
        unitTypeLabel={childUnitTypeLabel}
      />

      <DeleteUnitModal
        isOpen={deleteUnitModal.isOpen}
        onClose={handleCloseDeleteUnitModal}
        onConfirm={handleConfirmDeleteUnit}
        unit={deleteUnitData}
      />
    </>
  );
};

export default DonViPage;