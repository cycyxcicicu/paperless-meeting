import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { cn } from '@/common/utils/cn';

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
  isChair?: boolean;
}

interface SelectUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedMembers: Member[]) => void;
  mode: 'unit' | 'individual';
  title?: string;
  initialSelectedMembers?: Member[];
}

import { departmentApi } from '@/modules/organization/services/department.api';
import { userApi } from '@/modules/user/services/user.api';
import { useAuth } from '@/app/context/AuthContext';

// Map tree nodes from backend structure
const mapDepartmentTree = (nodes: any[]): UnitNode[] => {
  if (!nodes) return [];
  return nodes.map(node => ({
    id: String(node.id),
    name: node.deptName || node.name || '',
    children: node.children ? mapDepartmentTree(node.children) : undefined
  }));
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
      <div
        onClick={() => {
          onSelect(node.id, node.name);
        }}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer select-none',
          selectedUnitId === node.id
            ? 'bg-red-50 text-[#C8102E] btn-primary font-medium'
            : 'hover:bg-gray-50 text-gray-700'
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-gray-200/50 rounded transition-colors shrink-0 cursor-pointer flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </span>
        ) : (
          <div className="w-6 shrink-0" />
        )}
        <span className="flex-1 truncate">{node.name}</span>
      </div>

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
  initialSelectedMembers = [],
}) => {
  const { user } = useAuth();
  const creatorId = user ? String(user.id) : null;

  const creatorMember = useMemo<Member | null>(() => {
    if (!user) return null;
    let posName = '';
    if (user.position) {
      posName = typeof user.position === 'object' ? (user.position.positionName || user.position.name || '') : user.position;
    }
    let deptName = '';
    let deptId = '';
    if (user.department) {
      deptName = typeof user.department === 'object' ? (user.department.deptName || user.department.name || '') : user.department;
      deptId = typeof user.department === 'object' ? (user.department.id || '') : user.department;
    }
    return {
      id: String(user.id),
      name: user.fullName || user.username,
      position: posName,
      unit: deptName,
      unitId: deptId,
      email: user.email || '',
    };
  }, [user]);

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitName, setSelectedUnitName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMembersMap, setSelectedMembersMap] = useState<Record<string, Member>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [unitTree, setUnitTree] = useState<UnitNode[]>([]);
  const [membersDatabase, setMembersDatabase] = useState<Member[]>([]);

  const selectedCount = Object.keys(selectedMembersMap).length;

  useEffect(() => {
    if (isOpen) {
      const initialMap: Record<string, Member> = {};
      if (initialSelectedMembers) {
        initialSelectedMembers.forEach(m => {
          const strId = String(m.id);
          initialMap[strId] = {
            ...m,
            id: strId
          };
        });
      }
      if (creatorMember) {
        initialMap[creatorMember.id] = creatorMember;
      }
      setSelectedMembersMap(initialMap);
    }
  }, [isOpen, initialSelectedMembers, creatorMember]);

  // Fetch Tree on open and auto-select first node
  useEffect(() => {
    if (isOpen) {
      setIsTreeLoading(true);
      departmentApi.getTree()
        .then(res => {
          if (res.success && res.data) {
            const mapped = mapDepartmentTree(res.data);
            setUnitTree(mapped);
            if (mapped.length > 0) {
              setSelectedUnitId(mapped[0].id);
              setSelectedUnitName(mapped[0].name);
            }
          }
        })
        .catch(err => {
          console.error("Failed to load department tree", err);
        })
        .finally(() => {
          setIsTreeLoading(false);
        });
    }
  }, [isOpen]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUnitId(null);
      setSelectedUnitName('');
      setMemberSearchQuery('');
    }
  }, [isOpen]);

  // Fetch Members on unit selection
  useEffect(() => {
    if (selectedUnitId) {
      setIsLoading(true);
      userApi.getUsers({ departmentId: selectedUnitId, size: 1000 })
        .then(res => {
          if (res.success && res.data?.content) {
            const mapped = res.data.content.map((u: any) => {
              let posName = '';
              if (u.position) {
                posName = typeof u.position === 'object' ? (u.position.positionName || u.position.name || '') : u.position;
              }
              let deptName = '';
              let deptId = '';
              if (u.department) {
                deptName = typeof u.department === 'object' ? (u.department.deptName || u.department.name || '') : u.department;
                deptId = typeof u.department === 'object' ? (u.department.id || '') : u.department;
              }
              return {
                id: String(u.id),
                name: u.fullName || u.username,
                position: posName,
                unit: deptName,
                unitId: deptId || selectedUnitId,
                email: u.email || '',
              };
            });
            setMembersDatabase(mapped);
          }
        })
        .catch(err => {
          console.error("Failed to load users for department", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setMembersDatabase([]);
    }
  }, [selectedUnitId]);

  // Reset page when unit or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUnitId, memberSearchQuery]);

  // Filter members by selected unit (including child units)
  const unitFilteredMembers = useMemo(() => {
    return membersDatabase;
  }, [membersDatabase]);

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
    const strId = String(memberId);
    if (creatorId && strId === creatorId) return; // Prevent toggling the creator!
    setSelectedMembersMap(prev => {
      const next = { ...prev };
      if (next[strId]) {
        delete next[strId];
      } else {
        const found = membersDatabase.find(m => String(m.id) === strId);
        if (found) {
          next[strId] = {
            ...found,
            id: strId
          };
        }
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    const allSelectedOnPage = paginatedMembers.every((m) => !!selectedMembersMap[String(m.id)] || (creatorId && String(m.id) === creatorId));
    setSelectedMembersMap(prev => {
      const next = { ...prev };
      if (allSelectedOnPage) {
        paginatedMembers.forEach((m) => {
          const strId = String(m.id);
          if (!creatorId || strId !== creatorId) {
            delete next[strId];
          }
        });
      } else {
        paginatedMembers.forEach((m) => {
          const strId = String(m.id);
          next[strId] = {
            ...m,
            id: strId
          };
        });
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedMembersMap(prev => {
      const next: Record<string, Member> = {};
      if (creatorId && prev[creatorId]) {
        next[creatorId] = prev[creatorId];
      } else if (creatorMember) {
        next[creatorMember.id] = creatorMember;
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedMap = { ...selectedMembersMap };
    if (creatorMember) {
      selectedMap[creatorMember.id] = creatorMember;
    }
    const selected = Object.values(selectedMap);
    onConfirm(selected);
    setSelectedMembersMap({});
    setSelectedUnitId(null);
    setMemberSearchQuery('');
    onClose();
  };

  const allCurrentPageSelected =
    paginatedMembers.length > 0 && paginatedMembers.every((m) => !!selectedMembersMap[String(m.id)] || (creatorId && String(m.id) === creatorId));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[800px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg btn-primary text-gray-900">
            {selectedUnitName || title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Global Search Bars on the same line */}
        <div className="flex gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50/50">
          <div className="relative w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm đơn vị..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] bg-white"
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nhân viên..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] bg-white"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Unit Tree */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">

            <div className="flex-1 overflow-y-auto p-2">
              {isTreeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 text-[#C8102E] animate-spin" />
                </div>
              ) : unitTree.length === 0 ? (
                <p className="text-sm text-gray-500 p-4">Không có dữ liệu đơn vị</p>
              ) : (
                unitTree.map((unit) => (
                  <UnitTreeNode
                    key={unit.id}
                    node={unit}
                    level={0}
                    selectedUnitId={selectedUnitId}
                    onSelect={handleUnitSelect}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Members List */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm btn-primary text-gray-700">
                    Danh sách nhân viên {selectedUnitName && `- ${selectedUnitName}`}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {searchFilteredMembers.length} thành viên
                    {selectedCount > 0 && (
                      <>
                        {' • '}
                        <span className="text-[#C8102E] btn-primary">
                          {selectedCount} đã chọn
                        </span>
                      </>
                    )}
                  </p>
                </div>
                {selectedCount > 0 && (
                  <button
                    onClick={handleClearSelection}
                    className="text-xs text-gray-600 hover:text-[#C8102E] body transition-colors"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
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
                  <p className="text-sm body text-gray-900 mb-1">
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
                      <th className="px-4 py-3 text-left text-xs btn-primary text-gray-600 uppercase">
                        Họ và tên
                      </th>
                      <th className="px-4 py-3 text-left text-xs btn-primary text-gray-600 uppercase">
                        Chức vụ
                      </th>
                      <th className="px-4 py-3 text-left text-xs btn-primary text-gray-600 uppercase">
                        Đơn vị
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedMembers.map((member) => {
                      const isCreator = creatorId && String(member.id) === creatorId;
                      const isSelected = !!selectedMembersMap[String(member.id)] || isCreator;
                      return (
                        <tr
                          key={member.id}
                          onClick={() => {
                            if (!isCreator) {
                              handleToggleMember(String(member.id));
                            }
                          }}
                          className={cn(
                            'hover:bg-gray-50 transition-colors cursor-pointer',
                            isSelected && 'bg-red-50',
                            isCreator && 'cursor-not-allowed opacity-80'
                          )}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (!isCreator) {
                                  handleToggleMember(String(member.id));
                                }
                              }}
                              disabled={!!isCreator}
                              className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm body text-gray-900 font-medium">
                            {member.name} {isCreator && <span className="text-xs text-gray-400 font-normal ml-1">(Người tạo)</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.position}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.unit}</td>
                        </tr>
                      );
                    })}
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
                              ? 'bg-[#C8102E] text-white btn-primary'
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
            disabled={selectedCount === 0}
          >
            Xác nhận ({selectedCount})
          </Button>
        </div>
      </div>
    </div>
  );
};

export { SelectUnitModal };
export type { Member };
