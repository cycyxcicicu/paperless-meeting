import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { CustomSelect } from '@/common/components/ui/custom-select';

interface ConfirmAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (attendance: 'attend' | 'absent', data?: AbsentData) => void;
}

interface AbsentData {
  isFullSession: boolean;
  reason: string;
  contentIds: string[];
  substituteId?: string;
}

export const ConfirmAttendanceModal: React.FC<ConfirmAttendanceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedOption, setSelectedOption] = useState<'attend' | 'absent'>('attend');
  const [isFullSession, setIsFullSession] = useState(false);
  const [reason, setReason] = useState('');
  const [contentIds, setContentIds] = useState<string[]>(['']);
  const [substituteId, setSubstituteId] = useState('');

  const resetForm = () => {
    setSelectedOption('attend');
    setIsFullSession(false);
    setReason('');
    setContentIds(['']);
    setSubstituteId('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleConfirm = () => {
    if (selectedOption === 'attend') {
      onConfirm('attend');
      handleClose();
    } else {
      if (!reason.trim()) {
        alert('Vui lòng nhập lý do vắng mặt');
        return;
      }
      if (!isFullSession && !contentIds[0]) {
        alert('Vui lòng chọn ít nhất một nội dung vắng mặt');
        return;
      }
      onConfirm('absent', {
        isFullSession,
        reason,
        contentIds: contentIds.filter((id) => id),
        substituteId,
      });
      handleClose();
    }
  };

  const handleAddContent = () => {
    setContentIds([...contentIds, '']);
  };

  const handleRemoveContent = (index: number) => {
    setContentIds(contentIds.filter((_, i) => i !== index));
  };

  const handleOptionChange = (option: 'attend' | 'absent') => {
    setSelectedOption(option);
    if (option === 'attend') {
      // Reset các trường khi chọn "Tham gia"
      setIsFullSession(false);
      setReason('');
      setContentIds(['']);
      setSubstituteId('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in-0 zoom-in-95 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <h3 className="text-lg btn-primary text-gray-900">Xác nhận tham gia</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="px-6 py-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* Radio: Tham gia */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center w-5 h-5">
                <input
                  type="radio"
                  name="attendance"
                  value="attend"
                  checked={selectedOption === 'attend'}
                  onChange={() => handleOptionChange('attend')}
                  className="absolute opacity-0 w-0 h-0"
                />
                <div
                  className={`w-5 h-5 border-2 rounded-full transition-all flex items-center justify-center ${
                    selectedOption === 'attend'
                      ? 'border-[#C8102E]'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full bg-[#C8102E] transition-transform ${
                      selectedOption === 'attend' ? 'scale-100' : 'scale-0'
                    }`}
                  />
                </div>
              </div>
              <span className="text-base text-gray-900 group-hover:text-[#C8102E] transition-colors">
                Tham gia
              </span>
            </label>

            {/* Radio: Báo vắng */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center w-5 h-5">
                <input
                  type="radio"
                  name="attendance"
                  value="absent"
                  checked={selectedOption === 'absent'}
                  onChange={() => handleOptionChange('absent')}
                  className="absolute opacity-0 w-0 h-0"
                />
                <div
                  className={`w-5 h-5 border-2 rounded-full transition-all flex items-center justify-center ${
                    selectedOption === 'absent'
                      ? 'border-[#C8102E]'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full bg-[#C8102E] transition-transform ${
                      selectedOption === 'absent' ? 'scale-100' : 'scale-0'
                    }`}
                  />
                </div>
              </div>
              <span className="text-base text-gray-900 group-hover:text-[#C8102E] transition-colors">
                Báo vắng
              </span>
            </label>

            {/* Phần hiển thị khi chọn Báo vắng */}
            {selectedOption === 'absent' && (
              <div className="mt-6 space-y-4 pl-8 border-l-2 border-gray-200">
                {/* Checkbox: Báo vắng toàn phiên */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isFullSession}
                    onChange={(e) => {
                      setIsFullSession(e.target.checked);
                      if (e.target.checked) {
                        setContentIds(['']);
                      }
                    }}
                    className="w-4 h-4 text-[#C8102E] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#C8102E] cursor-pointer transition-all checked:bg-[#C8102E] checked:border-[#C8102E] hover:border-gray-400 accent-[#C8102E]"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    Báo vắng toàn phiên
                  </span>
                </label>

                {/* Lý do vắng mặt */}
                <div>
                  <label className="block text-sm body text-gray-700 mb-2">
                    Lý do vắng mặt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none text-sm text-gray-900 placeholder:text-gray-400 transition-all hover:border-gray-400"
                    placeholder="Nhập lý do vắng mặt"
                  />
                </div>

                {/* Nội dung vắng mặt */}
                {!isFullSession && (
                  <div className="space-y-3">
                    {contentIds.map((contentId, index) => (
                      <div key={index}>
                        <label className="block text-sm body text-gray-700 mb-2">
                          Nội dung vắng mặt {index + 1}{' '}
                          {index === 0 && <span className="text-red-500">*</span>}
                        </label>
                        <div className="flex gap-2">
                          <CustomSelect
                            value={contentId}
                            onChange={(value) => {
                              const newIds = [...contentIds];
                              newIds[index] = value;
                              setContentIds(newIds);
                            }}
                            options={[
                              { value: '1', label: 'Nội dung 1: Báo cáo tình hình KT-XH' },
                              { value: '2', label: 'Nội dung 2: Kế hoạch triển khai Quý II' },
                            ]}
                            placeholder="Chọn 1/ nhiều nội dung"
                            className="flex-1"
                          />
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveContent(index)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Người đi thay */}
                <div>
                  <label className="block text-sm body text-gray-700 mb-2">
                    Người đi thay
                  </label>
                  <CustomSelect
                    value={substituteId}
                    onChange={setSubstituteId}
                    options={[
                      { value: '1', label: 'Nguyễn Văn A - Phó Giám đốc' },
                      { value: '2', label: 'Trần Thị B - Trưởng phòng' },
                      { value: '3', label: 'Lê Văn C - Chuyên viên' },
                    ]}
                    placeholder="Chọn người đi thay"
                    allowClear
                  />
                </div>

                {/* Nút thêm nội dung vắng mặt */}
                {!isFullSession && (
                  <Button
                    variant="outline"
                    onClick={handleAddContent}
                    className="w-full border-[#C8102E] text-[#C8102E] hover:bg-red-50 rounded-lg h-10 body"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm nội dung vắng mặt
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg h-10 body transition-all"
          >
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-[#C8102E] hover:bg-[#a80d26] text-white rounded-lg h-10 body transition-all"
          >
            Xác nhận
          </Button>
        </div>
      </div>
    </div>
  );
};
