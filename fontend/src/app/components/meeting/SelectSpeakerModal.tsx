import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/app/components/common/ui/Button';
import { Input } from '../ui/input';
import { Badge } from '@/app/components/ui/badge';

interface Participant {
  id: string;
  name: string;
  position: string;
  unit: string;
  attendanceStatus?: string;
  type: 'unit' | 'individual' | 'guest' | 'group';
}

interface SelectSpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (participants: Participant[]) => void;
  participants: Participant[];
  existingSpeakerIds: (string | number)[];
  allowMultiple?: boolean;
}

export const SelectSpeakerModal: React.FC<SelectSpeakerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  participants,
  existingSpeakerIds,
  allowMultiple = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleClose = () => {
    setSearchQuery('');
    setSelectedIds([]);
    onClose();
  };

  const handleConfirm = () => {
    const selectedParticipants = participants.filter((p) =>
      selectedIds.includes(p.id)
    );
    onSelect(selectedParticipants);
    handleClose();
  };

  const handleToggleSelect = (id: string) => {
    if (allowMultiple) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  // Filter participants by search query
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;

    const query = searchQuery.toLowerCase();
    return participants.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query) ||
        p.unit.toLowerCase().includes(query)
    );
  }, [participants, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 animate-in fade-in-0 zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Chọn người phát biểu</h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, chức vụ, đơn vị..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Body - Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Search className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Chưa có người tham gia cuộc họp</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Search className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Không tìm thấy kết quả</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 font-semibold text-gray-600 w-16 text-center">
                    STT
                  </th>
                  <th className="py-3 px-4 font-semibold text-gray-600">
                    Họ và tên
                  </th>
                  <th className="py-3 px-4 font-semibold text-gray-600">
                    Đơn vị
                  </th>
                  <th className="py-3 px-4 font-semibold text-gray-600">
                    Chức vụ
                  </th>
                  <th className="py-3 px-4 font-semibold text-gray-600 w-32 text-center">
                    Trạng thái
                  </th>
                  <th className="py-3 px-4 font-semibold text-gray-600 w-24 text-center">
                    Chọn
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant, index) => {
                  const isExisting = existingSpeakerIds.includes(participant.id);
                  const isSelected = selectedIds.includes(participant.id);
                  const isDisabled = isExisting;

                  return (
                    <tr
                      key={participant.id}
                      className={`border-b border-gray-100 ${
                        isDisabled
                          ? 'bg-gray-50 opacity-50'
                          : isSelected
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-gray-700">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {participant.name}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{participant.unit}</td>
                      <td className="py-3 px-4 text-gray-700">{participant.position}</td>
                      <td className="py-3 px-4 text-center">
                        {isExisting ? (
                          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 px-3 py-1 text-xs rounded-full border-none">
                            Đã thêm
                          </Badge>
                        ) : participant.attendanceStatus ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">
                            {participant.attendanceStatus}
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {allowMultiple ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => handleToggleSelect(participant.id)}
                            className="w-4 h-4 text-[#C8102E] border-gray-300 rounded focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        ) : (
                          <input
                            type="radio"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => handleToggleSelect(participant.id)}
                            className="w-4 h-4 text-[#C8102E] border-gray-300 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedIds.length > 0 && (
              <span>
                Đã chọn: <strong>{selectedIds.length}</strong> người
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="bg-[#C8102E] hover:bg-[#a80d26] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export type { Participant };
