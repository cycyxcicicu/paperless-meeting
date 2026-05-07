import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Users, 
  Info, 
  LayoutDashboard, 
  Shield, 
  Briefcase, 
  History, 
  Settings 
} from 'lucide-react';

import { Sidebar, SidebarItem } from '../components/layout/Sidebar';
import { OrgTree, TreeNode } from '../components/organization/OrgTree';
import { UnitHeader } from '../components/organization/UnitHeader';
import { UnitInfoTab } from '../components/organization/UnitInfoTab';
import { ChildUnitsTab } from '../components/organization/ChildUnitsTab';
import { UnitUsersTab } from '../components/organization/UnitUsersTab';
import { cn } from '../../lib/utils';

const sidebarItems: SidebarItem[] = [
  { name: 'Quản lý người dùng', path: '/nguoi-dung', icon: Users },
  { name: 'Vai trò và phân quyền', path: '/nguoi-dung/vai-tro', icon: Shield },
  { name: 'Đơn vị', path: '/nguoi-dung/don-vi', icon: Building2 },
  { name: 'Chức vụ', path: '/nguoi-dung/chuc-vu', icon: Briefcase },
  { name: 'Lịch sử thao tác', path: '/nguoi-dung/lich-su', icon: History },
  { name: 'Cấu hình', path: '/nguoi-dung/cau-hinh', icon: Settings },
];

type TabKey = 'info' | 'child-units' | 'users';

const DonViChiTietPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [selectedTreeNode, setSelectedTreeNode] = useState<string>('root');

  // Mock data maintained from original
  const [treeData, setTreeData] = useState<TreeNode[]>([
    {
      id: 'root',
      name: 'Văn phòng UBND thành phố Hải Phòng',
      code: 'UBND_HP',
      level: 0,
      isExpanded: true,
      children: [
        {
          id: '1',
          name: 'Sở Tài chính',
          code: 'STC',
          level: 1,
          isExpanded: true,
          children: [
            { id: '1-1', name: 'Phòng Kế toán', code: 'PKT', level: 2 },
            { id: '1-2', name: 'Phòng Ngân sách', code: 'PNS', level: 2 },
          ]
        },
        {
          id: '2',
          name: 'Sở Kế hoạch và Đầu tư',
          code: 'SKHDT',
          level: 1,
          isExpanded: false,
          children: [
            { id: '2-1', name: 'Phòng Kế hoạch', code: 'PKH', level: 2 },
            { id: '2-2', name: 'Phòng Đầu tư', code: 'PDT', level: 2 },
          ]
        },
        { id: '3', name: 'Sở Xây dựng', code: 'SXD', level: 1 },
        { id: '4', name: 'Sở Giao thông vận tải', code: 'SGTVT', level: 1 },
        { id: '5', name: 'Sở Nông nghiệp và Phát triển nông thôn', code: 'SNNPTNT', level: 1 },
      ]
    }
  ]);

  const unitDetailsDatabase: Record<string, any> = {
    'root': {
      id: 'root',
      name: 'Văn phòng UBND thành phố Hải Phòng',
      code: 'UBND_HP',
      address: 'Số 8 Hoàng Văn Thụ, Hồng Bàng, Hải Phòng',
      phone: '0225.3842.569',
      email: 'vanphong@haiphong.gov.vn',
      establishedDate: '15/05/1955',
      director: 'Nguyễn Văn Tùng',
      contactPerson: 'Trần Thị Mai',
      description: 'Văn phòng UBND thành phố Hải Phòng là cơ quan tham mưu, giúp việc cho UBND thành phố trong việc tổ chức, điều hành và quản lý các hoạt động hành chính của thành phố.',
      isActive: true,
      totalMembers: 245,
      totalChildUnits: 10
    },
    '1': {
      id: '1',
      name: 'Sở Tài chính',
      code: 'STC',
      address: 'Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng',
      phone: '0225.3746.123',
      email: 'sotaichinh@haiphong.gov.vn',
      parentId: 'root',
      parentName: 'Văn phòng UBND thành phố Hải Phòng',
      establishedDate: '20/08/1960',
      director: 'Trần Thị Mai',
      contactPerson: 'Phạm Văn Hòa',
      description: 'Sở Tài chính là cơ quan chuyên môn thuộc UBND thành phố, có chức năng tham mưu, giúp UBND thành phố thực hiện chức năng quản lý nhà nước về tài chính.',
      isActive: true,
      totalMembers: 85,
      totalChildUnits: 2
    },
    '1-1': {
      id: '1-1',
      name: 'Phòng Kế toán',
      code: 'PKT',
      address: 'Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng',
      phone: '0225.3746.124',
      email: 'ketoan@sotaichinh.haiphong.gov.vn',
      parentId: '1',
      parentName: 'Sở Tài chính',
      establishedDate: '01/01/1965',
      director: 'Phạm Văn Hòa',
      contactPerson: 'Nguyễn Thị Lan',
      description: 'Phòng Kế toán chịu trách nhiệm quản lý, điều hành công tác kế toán, hạch toán và báo cáo tài chính của Sở.',
      isActive: true,
      totalMembers: 28,
      totalChildUnits: 0
    },
    '1-2': {
      id: '1-2',
      name: 'Phòng Ngân sách',
      code: 'PNS',
      address: 'Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng',
      phone: '0225.3746.125',
      email: 'ngansach@sotaichinh.haiphong.gov.vn',
      parentId: '1',
      parentName: 'Sở Tài chính',
      establishedDate: '01/01/1965',
      director: 'Lê Thị Hương',
      contactPerson: 'Vũ Văn Nam',
      description: 'Phòng Ngân sách chịu trách nhiệm xây dựng, quản lý và điều hành ngân sách của Sở theo quy định.',
      isActive: true,
      totalMembers: 32,
      totalChildUnits: 0
    },
    '2': {
      id: '2',
      name: 'Sở Kế hoạch và Đầu tư',
      code: 'SKHDT',
      address: 'Số 45 Lạch Tray, Ngô Quyền, Hải Phòng',
      phone: '0225.3822.456',
      email: 'sokehoach@haiphong.gov.vn',
      parentId: 'root',
      parentName: 'Văn phòng UBND thành phố Hải Phòng',
      establishedDate: '15/03/1962',
      director: 'Hoàng Văn Minh',
      contactPerson: 'Đỗ Thị Lan',
      description: 'Sở Kế hoạch và Đầu tư là cơ quan chuyên môn thuộc UBND thành phố, thực hiện quản lý nhà nước về kế hoạch và đầu tư.',
      isActive: true,
      totalMembers: 72,
      totalChildUnits: 2
    },
    '2-1': {
      id: '2-1',
      name: 'Phòng Kế hoạch',
      code: 'PKH',
      address: 'Số 45 Lạch Tray, Ngô Quyền, Hải Phòng',
      phone: '0225.3822.457',
      email: 'kehoach@sokehoach.haiphong.gov.vn',
      parentId: '2',
      parentName: 'Sở Kế hoạch và Đầu tư',
      establishedDate: '10/05/1965',
      director: 'Đỗ Thị Lan',
      contactPerson: 'Nguyễn Văn Bình',
      description: 'Phòng Kế hoạch chịu trách nhiệm xây dựng các kế hoạch phát triển kinh tế - xã hội của thành phố.',
      isActive: true,
      totalMembers: 24,
      totalChildUnits: 0
    },
    '2-2': {
      id: '2-2',
      name: 'Phòng Đầu tư',
      code: 'PDT',
      address: 'Số 45 Lạch Tray, Ngô Quyền, Hải Phòng',
      phone: '0225.3822.458',
      email: 'dautu@sokehoach.haiphong.gov.vn',
      parentId: '2',
      parentName: 'Sở Kế hoạch và Đầu tư',
      establishedDate: '10/05/1965',
      director: 'Vũ Văn Đức',
      contactPerson: 'Lê Thị Thu',
      description: 'Phòng Đầu tư thực hiện quản lý các dự án đầu tư, đăng ký kinh doanh và xúc tiến đầu tư.',
      isActive: true,
      totalMembers: 30,
      totalChildUnits: 0
    },
  };

  const allChildUnits: Record<string, any[]> = {
    'root': [
      { id: 1, name: 'Sở Tài chính', code: 'STC', address: 'Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng', phone: '0225.3746.123', totalMembers: 85, isActive: true },
      { id: 2, name: 'Sở Kế hoạch và Đầu tư', code: 'SKHDT', address: 'Số 45 Lạch Tray, Ngô Quyền, Hải Phòng', phone: '0225.3822.456', totalMembers: 72, isActive: true },
      { id: 3, name: 'Sở Xây dựng', code: 'SXD', address: 'Số 78 Trần Phú, Hồng Bàng, Hải Phòng', phone: '0225.3745.890', totalMembers: 95, isActive: true },
      { id: 4, name: 'Sở Giao thông vận tải', code: 'SGTVT', address: 'Số 56 Lê Thánh Tông, Máy Chai, Ngô Quyền, Hải Phòng', phone: '0225.3831.234', totalMembers: 110, isActive: true },
      { id: 5, name: 'Sở Nông nghiệp và Phát triển nông thôn', code: 'SNNPTNT', address: 'Số 34 Lạch Tray, Ngô Quyền, Hải Phòng', phone: '0225.3826.789', totalMembers: 68, isActive: true },
    ],
    '1': [
      { id: 6, name: 'Phòng Kế toán', code: 'PKT', address: 'Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng', phone: '0225.3746.124', totalMembers: 28, isActive: true },
      { id: 7, name: 'Phòng Ngân sách', code: 'PNS', address: 'Số 12 Điện Biên Phủ, Hồng Bàng, Hải Phòng', phone: '0225.3746.125', totalMembers: 32, isActive: true },
    ],
    '2': [
      { id: 8, name: 'Phòng Kế hoạch', code: 'PKH', address: 'Số 45 Lạch Tray, Ngô Quyền, Hải Phòng', phone: '0225.3822.457', totalMembers: 24, isActive: true },
      { id: 9, name: 'Phòng Đầu tư', code: 'PDT', address: 'Số 45 Lạch Tray, Ngô Quyền, Hải Phòng', phone: '0225.3822.458', totalMembers: 30, isActive: true },
    ],
  };

  const allUnitUsers: Record<string, any[]> = {
    'root': [
      { id: 1, username: 'nguyenvantung', fullName: 'Nguyễn Văn Tùng', email: 'tung.nguyen@haiphong.gov.vn', phone: '0912345678', role: 'Quản trị viên', position: 'Chủ tịch UBND', isActive: true },
      { id: 2, username: 'tranthimai', fullName: 'Trần Thị Mai', email: 'mai.tran@haiphong.gov.vn', phone: '0923456789', role: 'Quản lý', position: 'Chánh Văn phòng', isActive: true },
      { id: 3, username: 'levannam', fullName: 'Lê Văn Nam', email: 'nam.le@haiphong.gov.vn', phone: '0934567890', role: 'Nhân viên', position: 'Chuyên viên tổng hợp', isActive: true },
      { id: 4, username: 'phamthihuong', fullName: 'Phạm Thị Hương', email: 'huong.pham@haiphong.gov.vn', phone: '0945678901', role: 'Nhân viên', position: 'Chuyên viên CNTT', isActive: true },
    ],
    '1': [
      { id: 10, username: 'tranthimai', fullName: 'Trần Thị Mai', email: 'mai.tran@sotaichinh.haiphong.gov.vn', phone: '0923456789', role: 'Quản lý', position: 'Giám đốc Sở', isActive: true },
      { id: 11, username: 'phamvanhoa', fullName: 'Phạm Văn Hòa', email: 'hoa.pham@sotaichinh.haiphong.gov.vn', phone: '0987654321', role: 'Quản lý', position: 'Trưởng phòng Kế toán', isActive: true },
    ],
    '1-1': [
      { id: 13, username: 'phamvanhoa', fullName: 'Phạm Văn Hòa', email: 'hoa.pham@sotaichinh.haiphong.gov.vn', phone: '0987654321', role: 'Quản lý', position: 'Trưởng phòng', isActive: true },
      { id: 14, username: 'nguyenthilan', fullName: 'Nguyễn Thị Lan', email: 'lan.nguyen@sotaichinh.haiphong.gov.vn', phone: '0965432109', role: 'Nhân viên', position: 'Kế toán trưởng', isActive: true },
    ],
  };

  const currentUnit = unitDetailsDatabase[selectedTreeNode] || unitDetailsDatabase['root'];
  const childUnits = allChildUnits[selectedTreeNode] || [];
  const unitUsers = allUnitUsers[selectedTreeNode] || [];

  const toggleTreeNode = (nodeId: string, nodes: TreeNode[]): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, isExpanded: !node.isExpanded };
      }
      if (node.children) {
        return { ...node, children: toggleTreeNode(nodeId, node.children) };
      }
      return node;
    });
  };

  const handleTreeNodeToggle = (nodeId: string) => {
    setTreeData(toggleTreeNode(nodeId, treeData));
  };

  const tabs = [
    { key: 'info' as TabKey, label: 'Thông tin đơn vị', icon: Info },
    { key: 'child-units' as TabKey, label: 'Đơn vị trực thuộc', icon: Building2, count: childUnits.length },
    { key: 'users' as TabKey, label: 'Danh sách nhân sự', icon: Users, count: unitUsers.length },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar items={sidebarItems} />

      <main className="flex-1 ml-64 flex flex-col">
        {/* Unit Header */}
        <UnitHeader 
          unitName={currentUnit.name}
          unitCode={currentUnit.code}
          isActive={currentUnit.isActive}
          parentName={currentUnit.parentName}
          onEdit={() => console.log('Edit')}
          onAddChild={() => console.log('Add Child')}
        />

        {/* Master-Detail Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Organization Tree */}
          <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Cơ cấu tổ chức
              </h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <OrgTree 
                treeData={treeData}
                selectedId={selectedTreeNode}
                onSelect={setSelectedTreeNode}
                onToggle={handleTreeNodeToggle}
              />
            </div>
          </div>

          {/* Right Panel: Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Custom Modern Tabs */}
            <div className="px-8 bg-white border-b border-gray-200 flex items-center gap-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "relative py-5 flex items-center gap-2.5 text-sm font-bold transition-all outline-none group",
                      isActive ? "text-[#C8102E]" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    <tab.icon className={cn("h-4.5 w-4.5", isActive ? "text-[#C8102E]" : "text-gray-400 group-hover:text-gray-500")} />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={cn(
                        "ml-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black",
                        isActive ? "bg-[#C8102E] text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                      )}>
                        {tab.count}
                      </span>
                    )}
                    
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-[#C8102E] rounded-t-full shadow-[0_-2px_8px_rgba(200,16,46,0.3)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content with Scroll */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + selectedTreeNode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-full"
                >
                  {activeTab === 'info' && <UnitInfoTab unit={currentUnit} />}
                  {activeTab === 'child-units' && (
                    <ChildUnitsTab 
                      units={childUnits} 
                      onAdd={() => console.log('Add Unit')} 
                    />
                  )}
                  {activeTab === 'users' && (
                    <UnitUsersTab 
                      users={unitUsers} 
                      onAdd={() => console.log('Add User')} 
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DonViChiTietPage;
