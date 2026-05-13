import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { Button } from '@/app/components/common/ui/Button';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVote: (option: 'agree' | 'disagree' | 'other', otherContent?: string) => void;
  issueTitle: string;
  durationMinutes: number;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  onClose,
  onVote,
  issueTitle,
  durationMinutes,
}) => {
  const [selectedOption, setSelectedOption] = useState<'agree' | 'disagree' | 'other' | null>(null);
  const [otherContent, setOtherContent] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60); // Convert to seconds

  useEffect(() => {
    if (!isOpen) {
      // Reset states when modal closes
      setSelectedOption(null);
      setOtherContent('');
      setError('');
      return;
    }

    // Reset timer when modal opens
    setTimeLeft(durationMinutes * 60);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, durationMinutes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleVote = () => {
    if (!selectedOption) {
      setError('Vui lòng chọn một phương án');
      return;
    }

    // Validate "Ý kiến khác"
    if (selectedOption === 'other' && !otherContent.trim()) {
      setError('Vui lòng nhập ý kiến');
      return;
    }

    setError('');
    onVote(selectedOption, selectedOption === 'other' ? otherContent : undefined);
  };

  const handleOptionChange = (option: 'agree' | 'disagree' | 'other') => {
    setSelectedOption(option);
    setError('');
    // Clear other content when switching away from "other" option
    if (option !== 'other') {
      setOtherContent('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{issueTitle}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Timer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-semibold text-gray-900">
                  Thời gian biểu quyết còn lại
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-600 font-mono">
                {formatTime(timeLeft)}
              </p>
            </div>
            <p className="text-xs text-gray-600">(Lựa chọn tối đa 1 phương án)</p>
          </div>

          {/* Voting Options */}
          <div className="space-y-3">
            {/* Option 1: Agree */}
            <label
              className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                selectedOption === 'agree'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedOption === 'agree'
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedOption === 'agree' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">Đồng ý</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="votingOption"
                  value="agree"
                  checked={selectedOption === 'agree'}
                  onChange={() => handleOptionChange('agree')}
                  className="sr-only"
                />
              </div>
            </label>

            {/* Option 2: Disagree */}
            <label
              className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                selectedOption === 'disagree'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedOption === 'disagree'
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedOption === 'disagree' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      Không đồng ý
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="votingOption"
                  value="disagree"
                  checked={selectedOption === 'disagree'}
                  onChange={() => handleOptionChange('disagree')}
                  className="sr-only"
                />
              </div>
            </label>

            {/* Option 3: Other */}
            <div>
              <label
                className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedOption === 'other'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedOption === 'other'
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedOption === 'other' && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">Ý kiến khác</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="votingOption"
                    value="other"
                    checked={selectedOption === 'other'}
                    onChange={() => handleOptionChange('other')}
                    className="sr-only"
                  />
                </div>
              </label>

              {/* Textarea for "Other" option */}
              {selectedOption === 'other' && (
                <div className="mt-3 animate-in fade-in-0 slide-in-from-top-2">
                  <textarea
                    value={otherContent}
                    onChange={(e) => {
                      setOtherContent(e.target.value);
                      setError('');
                    }}
                    placeholder="Nhập ý kiến của bạn..."
                    rows={4}
                    className={`w-full px-4 py-3 border-2 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                      error && selectedOption === 'other'
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {error && selectedOption === 'other' && (
                    <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error message for general validation */}
          {error && selectedOption !== 'other' && (
            <p className="text-sm text-red-600 font-medium text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200">
          <Button
            onClick={handleVote}
            disabled={!selectedOption}
            className="bg-[#C8102E] hover:bg-[#a80d26] px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Biểu quyết
          </Button>
        </div>
      </div>
    </div>
  );
};
