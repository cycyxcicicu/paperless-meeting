import React from 'react';
import { Button } from '@/common/components/ui/button';
import { ChevronLeft, Save, Send, CheckCircle, X, Clock, CheckCheck } from 'lucide-react';
import { cn } from '@/common/utils/cn';

type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'sent';

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSaveDraftAgenda?: () => void;
  onSubmitForApproval?: () => void;
  onSubmitMeeting?: () => void;
  onCancel?: () => void;
  isLastStep?: boolean;
  approvalStatus?: ApprovalStatus;
  isUpdateMode?: boolean;
  isReadOnly?: boolean;
}

const WizardFooter: React.FC<WizardFooterProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSaveDraftAgenda,
  onSubmitForApproval,
  onSubmitMeeting,
  onCancel,
  isLastStep = false,
  approvalStatus = 'draft',
  isUpdateMode = false,
  isReadOnly = false,
}) => {
  const isApproved = approvalStatus === 'approved';
  const isPending = approvalStatus === 'pending';
  const canSubmitMeeting = isUpdateMode || isApproved; // Trong update mode không cần approval
  return (
    <div className="flex items-center justify-between">
          {/* Left: Cancel or Back button */}
          <div className="flex items-center gap-3">
            {currentStep === 1 ? (
              onCancel && (
                <button
                  onClick={onCancel}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#C8102E] text-[#C8102E] btn-primary text-sm hover:bg-red-50 transition-all"
                >
                  <X className="h-4 w-4" />
                  Hủy bỏ
                </button>
              )
            ) : (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 btn-primary text-sm hover:bg-gray-50 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Quay lại
              </button>
            )}
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-3">
            {/* Approval Status Badge - only on last step and not in update mode */}
            {!isUpdateMode && isLastStep && isPending && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm btn-primary text-amber-700">Đang chờ phê duyệt</span>
              </div>
            )}

            {!isUpdateMode && isLastStep && isApproved && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
                <CheckCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm btn-primary text-green-700">Đã duyệt</span>
              </div>
            )}

            {/* Last step: Submit for Approval + Submit Meeting */}
            {isLastStep ? (
              <>
                {/* Nút lưu tạm/lưu */}
                {onSaveDraftAgenda && !isReadOnly && (
                  <button
                    onClick={onSaveDraftAgenda}
                    disabled={isPending}
                    className={cn(
                      'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 btn-primary text-sm hover:bg-gray-50 transition-all',
                      isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Save className="h-4 w-4" />
                    {isUpdateMode ? 'Lưu' : 'Lưu tạm'}
                  </button>
                )}

                {/* Gửi phê duyệt */}
                {onSubmitForApproval && !isApproved && (
                  <button
                    onClick={onSubmitForApproval}
                    disabled={isPending || isReadOnly}
                    className={cn(
                      'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 btn-primary text-sm transition-all',
                      (isPending || isReadOnly)
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    <Send className="h-4 w-4" />
                    Gửi phê duyệt
                  </button>
                )}
                {onSubmitMeeting && (
                  <div className="relative group">
                    <button
                      onClick={onSubmitMeeting}
                      disabled={!canSubmitMeeting || isPending}
                      className={cn(
                        'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white btn-primary text-sm transition-all',
                        (canSubmitMeeting && !isPending)
                          ? 'hover:shadow-lg hover:shadow-red-500/25'
                          : 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isUpdateMode ? 'Công bố' : 'Gửi phiên họp'}
                    </button>
                    {!canSubmitMeeting && !isUpdateMode && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                          Cần được phê duyệt trước khi gửi phiên họp
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Not last step: Continue button */
              <button
                onClick={onNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white btn-primary text-sm hover:shadow-lg hover:shadow-red-500/25 transition-all"
              >
                {isReadOnly ? 'Tiếp tục' : 'Lưu và tiếp tục'}
              </button>
            )}
          </div>
    </div>
  );
};

export { WizardFooter };
