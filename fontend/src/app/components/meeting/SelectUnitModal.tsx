import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/common/ui/Button';
import { cn } from '../../../lib/utils';

interface UnitNode {
  id: string;
  name: string;
  children?: UnitNode[];
}

interface Member {
  id: string;
  name: string;
  position: string;
  unit: string;
  unitId: string;
  email: string;
}

interface SelectUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedMembers: Member[]) => void;
  mode: 'unit' | 'individual';
  title?: string;
}

// Mock unit tree structure
const mockUnits: UnitNode[] = [
  {
    id: '1',
    name: 'UBND Thành phố Hải Phòng',
    children: [
      {
        id: '1-1',
        name: 'Văn phòng UBND',
        children: [
          { id: '1-1-1', name: 'Phòng Hành chính' },
          { id: '1-1-2', name: 'Phòng Tổ chức' },
          { id: '1-1-3', name: 'Phòng Pháp chế' },
        ],
      },
      {
        id: '1-2',
        name: 'Sở Nội vụ',
        children: [
          { id: '1-2-1', name: 'Phòng Tổ chức cán bộ' },
          { id: '1-2-2', name: 'Phòng Chính quyền' },
          { id: '1-2-3', name: 'Phòng Văn thư - Lưu trữ' },
        ],
      },
      {
        id: '1-3',
        name: 'Sở Tài chính',
        children: [
          { id: '1-3-1', name: 'Phòng Ngân sách' },
          { id: '1-3-2', name: 'Phòng Kế toán' },
        ],
      },
      {
        id: '1-4',
        name: 'Sở Kế hoạch và Đầu tư',
        children: [
          { id: '1-4-1', name: 'Phòng Kế hoạch tổng hợp' },
          { id: '1-4-2', name: 'Phòng Quản lý đầu tư' },
        ],
      },
      {
        id: '1-5',
        name: 'Sở Xây dựng',
      },
      {
        id: '1-6',
        name: 'Sở Giao thông vận tải',
      },
    ],
  },
];

// Generate realistic mock members database
const generateMockMembers = (): Member[] => {
  const positions = [
    'Giám đốc',
    'Phó Giám đốc',
    'Trưởng phòng',
    'Phó phòng',
    'Chuyên viên chính',
    'Chuyên viên',
    'Cán sự',
  ];

  const firstNames = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương',
  ];

  const middleNames = ['Văn', 'Thị', 'Minh', 'Hữu', 'Đức', 'Quốc', 'Thanh', 'Thu', 'Hồng', 'Tuấn'];

  const lastNames = [
    'An', 'Bình', 'Cường', 'Dũng', 'Hà', 'Hằng', 'Hương', 'Khoa', 'Linh', 'Long',
    'Mai', 'Nam', 'Nga', 'Phong', 'Quân', 'Sơn', 'Tâm', 'Thắng', 'Trang', 'Tú',
    'Uyên', 'Vân', 'Vinh', 'Yến', 'Anh', 'Bảo', 'Chi', 'Đạt', 'Giang', 'Hiền',
  ];

  const units = [
    { id: '1-1-1', name: 'Phòng Hành chính' },
    { id: '1-1-2', name: 'Phòng Tổ chức' },
    { id: '1-1-3', name: 'Phòng Pháp chế' },
    { id: '1-2-1', name: 'Phòng Tổ chức cán bộ' },
    { id: '1-2-2', name: 'Phòng Chính quyền' },
    { id: '1-2-3', name: 'Phòng Văn thư - Lưu trữ' },
    { id: '1-3-1', name: 'Phòng Ngân sách' },
    { id: '1-3-2', name: 'Phòng Kế toán' },
    { id: '1-3', name: 'Sở Tài chính' },
    { id: '1-4-1', name: 'Phòng Kế hoạch tổng hợp' },
    { id: '1-4-2', name: 'Phòng Quản lý đầu tư' },
    { id: '1-4', name: 'Sở Kế hoạch và Đầu tư' },
    { id: '1-5', name: 'Sở Xây dựng' },
    { id: '1-6', name: 'Sở Giao thông vận tải' },
  ];

  const members: Member[] = [];
  let idCounter = 1;

  // Generate 5-15 members per unit
  units.forEach((unit) => {
    const memberCount = Math.floor(Math.random() * 11) + 5; // 5-15 members
    for (let i = 0; i < memberCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${middleName} ${lastName}`;

      const position = positions[Math.floor(Math.random() * positions.length)];

      const emailName = `${firstName.toLowerCase()}${lastName.toLowerCase()}${idCounter}`;

      members.push({
        id: `m${idCounter}`,
        name: fullName,
        position,
        unit: unit.name,
        unitId: unit.id,
        email: `${emailName}@haiphong.gov.vn`,
      });

      idCounter++;
    }
  });

  return members;
};

const mockMembersDatabase = generateMockMembers();

// Recursive function to get all child unit IDs
const getAllChildUnitIds = (unitId: string, units: UnitNode[]): string[] => {
  const result: string[] = [unitId];

  const findAndCollect = (nodes: UnitNode[]) => {
    for (const node of nodes) {
      if (node.id === unitId && node.children) {
        const collectChildren = (children: UnitNode[]) => {
          children.forEach((child) => {
            result.push(child.id);
            if (child.children) {
              collectChildren(child.children);
            }
          });
        };
        collectChildren(node.children);
        return;
      }
      if (node.children) {
        findAndCollect(node.children);
      }
    }
  };

  findAndCollect(units);
  return result;
};

const UnitTreeNode: React.FC<{
  node: UnitNode;
  level: number;
  selectedUnitId: string | null;
  onSelect: (id: string, name: string) => void;
}> = ({ node, level, selectedUnitId, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          onSelect(node.id, node.name);
        }}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left',
          selectedUnitId === node.id
            ? 'bg-red-50 text-[#C8102E] font-semibold'
            : 'hover:bg-gray-50 text-gray-700'
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )
        ) : (
          <div className="w-4" />
        )}
        <span className="flex-1">{node.name}</span>
      </button>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <UnitTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedUnitId={selectedUnitId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SelectUnitModal: React.FC<SelectUnitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mode,
  title = 'Chọn từ cây đơn vị',
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitName, setSelectedUnitName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Reset page when unit or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUnitId, memberSearchQuery]);

  // Simulate loading when changing units
  useEffect(() => {
    if (selectedUnitId) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedUnitId]);

  // Filter members by selected unit (including child units)
  const unitFilteredMembers = useMemo(() => {
    if (!selectedUnitId) {
      return mockMembersDatabase;
    }

    const allowedUnitIds = getAllChildUnitIds(selectedUnitId, mockUnits);
    return mockMembersDatabase.filter((m) => allowedUnitIds.includes(m.unitId));
  }, [selectedUnitId]);

  // Apply search filter
  const searchFilteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) {
      return unitFilteredMembers;
    }

    const query = memberSearchQuery.toLowerCase();
    return unitFilteredMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.position.toLowerCase().includes(query) ||
        m.unit.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
    );
  }, [unitFilteredMembers, memberSearchQuery]);

  // Paginate
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return searchFilteredMembers.slice(startIndex, startIndex + pageSize);
  }, [searchFilteredMembers, currentPage, pageSize]);

  if (!isOpen) return null;

  const handleUnitSelect = (unitId: string, unitName: string) => {
    setSelectedUnitId(unitId);
    setSelectedUnitName(unitName);
  };

  const totalPages = Math.ceil(searchFilteredMembers.length / pageSize);

  const handleToggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleToggleAll = () => {
    if (paginatedMembers.every((m) => selectedMembers.has(m.id))) {
      // Deselect all on current page
      const newSelected = new Set(selectedMembers);
      paginatedMembers.forEach((m) => newSelected.delete(m.id));
      setSelectedMembers(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedMembers);
      paginatedMembers.forEach((m) => newSelected.add(m.id));
      setSelectedMembers(newSelected);
    }
  };

  const handleClearSelection = () => {
    setSelectedMembers(new Set());
  };

  const handleConfirm = () => {
    const selected = mockMembersDatabase.filter((m) => selectedMembers.has(m.id));
    onConfirm(selected);
    setSelectedMembers(new Set());
    setSelectedUnitId(null);
    setMemberSearchQuery('');
    onClose();
  };

  const allCurrentPageSelected =
    paginatedMembers.length > 0 && paginatedMembers.every((m) => selectedMembers.has(m.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Unit Tree */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm đơn vị..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {mockUnits.map((unit) => (
                <UnitTreeNode
                  key={unit.id}
                  node={unit}
                  level={0}
                  selectedUnitId={selectedUnitId}
                  onSelect={handleUnitSelect}
                />
              ))}
            </div>
          </div>

          {/* Right Panel: Members List */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    {selectedUnitName || 'Danh sách đại biểu'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {searchFilteredMembers.length} thành viên
                    {selectedMembers.size > 0 && (
                      <>
                        {' • '}
                        <span className="text-[#C8102E] font-semibold">
                          {selectedMembers.size} đã chọn
                        </span>
                      </>
                    )}
                  </p>
                </div>
                {selectedMembers.size > 0 && (
                  <button
                    onClick={handleClearSelection}
                    className="text-xs text-gray-600 hover:text-[#C8102E] font-medium transition-colors"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm đại biểu..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                />
              </div>
            </div>

            {/* Table or Empty/Loading State */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 text-[#C8102E] animate-spin" />
                </div>
              ) : searchFilteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {selectedUnitId ? 'Không tìm thấy thành viên' : 'Chọn đơn vị để hiển thị'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedUnitId
                      ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn đơn vị khác'
                      : 'Vui lòng chọn đơn vị từ cây bên trái'}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allCurrentPageSelected}
                          onChange={handleToggleAll}
                          className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E]"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Họ và tên
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Chức vụ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Đơn vị
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedMembers.map((member) => (
                      <tr
                        key={member.id}
                        onClick={() => handleToggleMember(member.id)}
                        className={cn(
                          'hover:bg-gray-50 transition-colors cursor-pointer',
                          selectedMembers.has(member.id) && 'bg-red-50'
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedMembers.has(member.id)}
                            onChange={() => handleToggleMember(member.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E]"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {member.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{member.position}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{member.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!isLoading && searchFilteredMembers.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 pl-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-600">
                    {(currentPage - 1) * pageSize + 1}-
                    {Math.min(currentPage * pageSize, searchFilteredMembers.length)} / {searchFilteredMembers.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 mr-2">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>

                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            'w-8 h-8 text-sm rounded-lg transition-colors',
                            currentPage === pageNum
                              ? 'bg-[#C8102E] text-white font-semibold'
                              : 'border border-gray-300 hover:bg-gray-50'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={selectedMembers.size === 0}
          >
            Xác nhận ({selectedMembers.size})
          </Button>
        </div>
      </div>
    </div>
  );
};

export { SelectUnitModal };
export type { Member };
