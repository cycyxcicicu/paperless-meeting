import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Badge } from '@/common/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface VotingResult {
  agree: number;
  disagree: number;
  other: number;
  notVoted: number;
}

interface VotedDelegate {
  id: number;
  name: string;
  position: string;
  unit: string;
  vote: 'agree' | 'disagree' | 'other';
  otherContent?: string;
}

interface NotVotedDelegate {
  id: number;
  name: string;
  position: string;
  unit: string;
}

interface VotingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueTitle: string;
  results: VotingResult;
  votedDelegates: VotedDelegate[];
  notVotedDelegates: NotVotedDelegate[];
}

export const VotingResultModal: React.FC<VotingResultModalProps> = ({
  isOpen,
  onClose,
  issueTitle,
  results,
  votedDelegates,
  notVotedDelegates,
}) => {
  const [activeTab, setActiveTab] = useState<'voted' | 'not-voted'>('voted');
  const [showDelegateList, setShowDelegateList] = useState(false);

  if (!isOpen) return null;

  const totalVotes = results.agree + results.disagree + results.other + results.notVoted;
  const votedCount = results.agree + results.disagree + results.other;

  // Data for pie chart
  const chartData = [
    { name: 'Đồng ý', value: results.agree, color: '#16a34a' },
    { name: 'Không đồng ý', value: results.disagree, color: '#dc2626' },
    { name: 'Khác', value: results.other, color: '#f59e0b' },
    { name: 'Chưa trả lời', value: results.notVoted, color: '#9ca3af' },
  ].filter((item) => item.value > 0);

  const getPercentage = (value: number) => {
    if (totalVotes === 0) return '0';
    return ((value / totalVotes) * 100).toFixed(1);
  };

  const getVoteText = (delegate: VotedDelegate) => {
    switch (delegate.vote) {
      case 'agree':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">Đồng ý</Badge>;
      case 'disagree':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-3 py-1 text-xs rounded-full border-none">Không đồng ý</Badge>;
      case 'other':
        return (
          <div>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1 text-xs rounded-full border-none mb-1">Ý kiến khác</Badge>
            {delegate.otherContent && (
              <p className="text-xs text-gray-600 italic mt-1">"{delegate.otherContent}"</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg btn-primary text-gray-900">Kết quả biểu quyết</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Issue Title */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
            <p className="text-sm btn-primary text-gray-900">{issueTitle}</p>
          </div>

          {/* Chart and Statistics */}
          <div className="grid grid-cols-2 gap-6 mb-5">
            {/* Left: Donut Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Right: Statistics Table */}
            <div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-2 px-3 text-left btn-primary text-gray-700">
                      Phương án
                    </th>
                    <th className="py-2 px-3 text-center btn-primary text-gray-700">
                      Giá trị
                    </th>
                    <th className="py-2 px-3 text-center btn-primary text-gray-700">
                      Tỷ lệ (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        <span className="text-gray-900">Đồng ý</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center btn-primary">{results.agree}</td>
                    <td className="py-3 px-3 text-center btn-primary">
                      {getPercentage(results.agree)}%
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-600"></div>
                        <span className="text-gray-900">Không đồng ý</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center btn-primary">{results.disagree}</td>
                    <td className="py-3 px-3 text-center btn-primary">
                      {getPercentage(results.disagree)}%
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                        <span className="text-gray-900">Khác</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center btn-primary">{results.other}</td>
                    <td className="py-3 px-3 text-center btn-primary">
                      {getPercentage(results.other)}%
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-gray-900">Chưa trả lời</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center btn-primary">{results.notVoted}</td>
                    <td className="py-3 px-3 text-center btn-primary">
                      {getPercentage(results.notVoted)}%
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total Status */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm btn-primary text-gray-900">
                  Đã biểu quyết: {votedCount}/{totalVotes}
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Show Delegate List */}
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => setShowDelegateList(!showDelegateList)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  showDelegateList
                    ? 'bg-[#C8102E] focus:ring-[#C8102E]'
                    : 'bg-gray-300 focus:ring-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showDelegateList ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm body text-gray-900">
                Cho phép xem danh sách biểu quyết
              </span>
            </label>
          </div>

          {/* Delegate List */}
          {showDelegateList && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Tabs */}
              <div className="flex items-center gap-6 border-b border-gray-200 bg-gray-50 px-4">
                <button
                  onClick={() => setActiveTab('voted')}
                  className={`py-3 body text-sm border-b-2 transition-colors ${
                    activeTab === 'voted'
                      ? 'border-[#C8102E] text-[#C8102E]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Đã biểu quyết ({votedDelegates.length})
                </button>
                <button
                  onClick={() => setActiveTab('not-voted')}
                  className={`py-3 body text-sm border-b-2 transition-colors ${
                    activeTab === 'not-voted'
                      ? 'border-[#C8102E] text-[#C8102E]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Chưa biểu quyết ({notVotedDelegates.length})
                </button>
              </div>

              {/* Table Content */}
              <div className="max-h-80 overflow-y-auto">
                {activeTab === 'voted' ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 btn-primary text-gray-600 w-16 text-center">
                          STT
                        </th>
                        <th className="py-3 px-4 btn-primary text-gray-600">
                          Tên đại biểu
                        </th>
                        <th className="py-3 px-4 btn-primary text-gray-600">Chức vụ</th>
                        <th className="py-3 px-4 btn-primary text-gray-600">Tên đơn vị</th>
                        <th className="py-3 px-4 btn-primary text-gray-600">
                          Phương án đã chọn
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {votedDelegates.map((delegate, index) => (
                        <tr
                          key={delegate.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-center text-gray-700">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-gray-900 body">
                            {delegate.name}
                          </td>
                          <td className="py-3 px-4 text-gray-700">{delegate.position}</td>
                          <td className="py-3 px-4 text-gray-700">{delegate.unit}</td>
                          <td className="py-3 px-4">{getVoteText(delegate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 btn-primary text-gray-600 w-16 text-center">
                          STT
                        </th>
                        <th className="py-3 px-4 btn-primary text-gray-600">
                          Tên đại biểu
                        </th>
                        <th className="py-3 px-4 btn-primary text-gray-600">Chức vụ</th>
                        <th className="py-3 px-4 btn-primary text-gray-600">Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notVotedDelegates.map((delegate, index) => (
                        <tr
                          key={delegate.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-center text-gray-700">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-gray-900 body">
                            {delegate.name}
                          </td>
                          <td className="py-3 px-4 text-gray-700">{delegate.position}</td>
                          <td className="py-3 px-4 text-gray-700">{delegate.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <Button
            onClick={onClose}
            className="bg-[#C8102E] hover:bg-[#a80d26] px-8"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

export type { VotingResult, VotedDelegate, NotVotedDelegate };
