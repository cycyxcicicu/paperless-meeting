import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { CustomSelect } from '@/common/components/ui/custom-select';
import { DynamicFormRenderer } from '@/common/components/form-engine/DynamicFormRenderer';
import { FormFieldGroup } from '@/common/components/form-engine/form.types';
import { useForm, FormProvider } from 'react-hook-form';

import { meetingApi } from '@/modules/meeting/services/meeting.api';

interface ConfirmAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (attendance: 'attend' | 'absent', data?: AbsentData) => void;
  meetingId?: string;
}

interface AbsentData {
  isFullSession: boolean;
  reason: string;
  contentIds: string[];
  substituteId?: string;
  subName?: string;
  subPosition?: string;
  subAgency?: string;
  subEmail?: string;
  subPhone?: string;
}

const substituteFormGroups: FormFieldGroup[] = [
  {
    id: 'substitute-other-info',
    className: 'grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200',
    fields: [
      {
        key: 'subName',
        type: 'text',
        label: 'Họ và tên người đi thay',
        required: true,
        col: 'col-span-2',
        showPlaceholder: false,
      },
      {
        key: 'subPosition',
        type: 'text',
        label: 'Chức vụ',
        required: true,
        col: 'col-span-1',
        showPlaceholder: false,
      },
      {
        key: 'subAgency',
        type: 'text',
        label: 'Cơ quan/Đơn vị',
        required: true,
        col: 'col-span-1',
        showPlaceholder: false,
      },
      {
        key: 'subEmail',
        type: 'text',
        label: 'Email',
        required: true,
        col: 'col-span-1',
        showPlaceholder: false,
      },
      {
        key: 'subPhone',
        type: 'text',
        label: 'Số điện thoại',
        col: 'col-span-1',
        showPlaceholder: false,
      },
    ],
  },
];

export const ConfirmAttendanceModal: React.FC<ConfirmAttendanceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  meetingId,
}) => {
  const [substitutes, setSubstitutes] = useState<any[]>([]);
  const [agendaItems, setAgendaItems] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && meetingId) {
      meetingApi.getEligibleSubstitutes(meetingId)
        .then(res => {
          if (res.success && res.data) {
            setSubstitutes(res.data);
          }
        })
        .catch(err => console.error("Error fetching substitutes:", err));

      meetingApi.getAgendaItems(meetingId)
        .then(res => {
          if (res.success && res.data) {
            setAgendaItems(res.data);
          }
        })
        .catch(err => console.error("Error fetching agenda items:", err));
    }
  }, [isOpen, meetingId]);
  const methods = useForm({
    defaultValues: {
      attendance: 'attend',
      isFullSession: false,
      reason: '',
      contentIds: [''],
      substituteId: '',
      subName: '',
      subPosition: '',
      subAgency: '',
      subEmail: '',
      subPhone: '',
    }
  });

  const { watch, setValue, handleSubmit, reset, setError, clearErrors, formState: { errors } } = methods;
  const selectedOption = watch('attendance');
  const isFullSession = watch('isFullSession');
  const substituteId = watch('substituteId');
  const contentIds = watch('contentIds');

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: any) => {
    if (data.attendance === 'attend') {
      onConfirm('attend');
      handleClose();
    } else {
      let hasError = false;

      if (!data.reason?.trim()) {
        setError('reason', { type: 'manual', message: 'Vui lòng nhập lý do vắng mặt' });
        hasError = true;
      } else {
        clearErrors('reason');
      }

      if (!data.isFullSession && (!data.contentIds || !data.contentIds[0])) {
        setError('contentIds', { type: 'manual', message: 'Vui lòng chọn ít nhất một nội dung vắng mặt' });
        hasError = true;
      } else {
        clearErrors('contentIds');
      }

      if (data.substituteId === 'other') {
        if (!data.subName?.trim() || !data.subPosition?.trim() || !data.subAgency?.trim() || !data.subEmail?.trim()) {
          setError('subName', { type: 'manual', message: 'Vui lòng nhập đầy đủ thông tin người đi thay' });
          hasError = true;
        } else {
          clearErrors('subName');
        }
      }

      if (hasError) {
        return;
      }

      onConfirm('absent', {
        isFullSession: data.isFullSession,
        reason: data.reason,
        contentIds: data.contentIds.filter((id: string) => id),
        substituteId: data.substituteId,
        subName: data.subName,
        subPosition: data.subPosition,
        subAgency: data.subAgency,
        subEmail: data.subEmail,
        subPhone: data.subPhone,
      });
      handleClose();
    }
  };

  const handleAddContent = () => {
    setValue('contentIds', [...contentIds, '']);
    clearErrors('contentIds');
  };

  const handleRemoveContent = (index: number) => {
    const filtered = contentIds.filter((_, i) => i !== index);
    setValue('contentIds', filtered.length > 0 ? filtered : ['']);
    clearErrors('contentIds');
  };

  const handleOptionChange = (option: 'attend' | 'absent') => {
    setValue('attendance', option);
    clearErrors();
    if (option === 'attend') {
      reset({
        attendance: 'attend',
        isFullSession: false,
        reason: '',
        contentIds: [''],
        substituteId: '',
        subName: '',
        subPosition: '',
        subAgency: '',
        subEmail: '',
        subPhone: '',
      });
    }
  };

  const substituteOptions = [
    { value: 'other', label: 'Khác (Nhập thông tin mới)' },
    ...substitutes.map((s: any) => ({
      value: s.id,
      label: `${s.fullName}${s.position?.positionName ? ` - ${s.position.positionName}` : ''}`
    }))
  ];

  const agendaOptions = agendaItems.map((item: any) => ({
    value: item.id,
    label: `${item.orderNo ? `Nội dung ${item.orderNo}: ` : ''}${item.title}`
  }));

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
          <FormProvider {...methods}>
            <form id="attendance-form" onSubmit={handleSubmit(onSubmit)}>
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
                      setValue('isFullSession', e.target.checked);
                      if (e.target.checked) {
                        setValue('contentIds', ['']);
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
                    {...methods.register('reason')}
                    onChange={(e) => {
                      methods.register('reason').onChange(e);
                      if (e.target.value.trim()) clearErrors('reason');
                    }}
                    rows={3}
                    className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none text-sm text-gray-900 placeholder:text-gray-400 transition-all hover:border-gray-400 ${
                      errors.reason ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập lý do vắng mặt"
                  />
                  {errors.reason && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {errors.reason.message as string}
                    </span>
                  )}
                </div>

                {/* Nội dung vắng mặt */}
                {!isFullSession && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm body text-gray-700">
                        Nội dung vắng mặt <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddContent}
                        className="text-xs text-[#C8102E] hover:underline font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Thêm nội dung
                      </button>
                    </div>
                    {contentIds.map((contentId, index) => (
                      <div key={index} className="space-y-2">
                        {index > 0 && (
                          <div className="flex items-center justify-between">
                            <label className="block text-sm body text-gray-700">
                              Nội dung vắng mặt {index + 1}
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveContent(index)}
                              className="text-xs text-red-500 hover:underline font-medium"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                        <CustomSelect
                          value={contentId}
                          onChange={(value) => {
                            const newIds = [...contentIds];
                            newIds[index] = value;
                            setValue('contentIds', newIds);
                            if (value) clearErrors('contentIds');
                          }}
                          options={agendaOptions}
                          placeholder="Chọn 1/ nhiều nội dung"
                          className={`w-full ${errors.contentIds ? 'border-red-500' : ''}`}
                        />
                      </div>
                    ))}
                    {errors.contentIds && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {errors.contentIds.message as string}
                      </span>
                    )}
                  </div>
                )}

                {/* Người đi thay */}
                <div>
                  <label className="block text-sm body text-gray-700 mb-2">
                    Người đi thay
                  </label>
                  <CustomSelect
                    value={substituteId}
                    onChange={(val) => {
                      setValue('substituteId', val);
                      clearErrors('subName');
                    }}
                    showSearch
                    options={substituteOptions}
                    placeholder="Chọn người đi thay"
                    allowClear
                  />

                  {substituteId === 'other' && (
                    <div className="space-y-2">
                      <DynamicFormRenderer groups={substituteFormGroups} mode="create" />
                      {errors.subName && (
                        <span className="text-xs text-red-500 mt-1 block">
                          {errors.subName.message as string}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          </form>
          </FormProvider>
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
            type="submit"
            form="attendance-form"
            className="px-6 py-2.5 bg-[#C8102E] hover:bg-[#a80d26] text-white rounded-lg h-10 body transition-all"
          >
            Xác nhận
          </Button>
        </div>
      </div>
    </div>
  );
};
