import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Badge } from '@/common/components/ui/badge';
import { Card, CardContent  } from '@/common/components/ui/card';

interface Delegate {
  id: number;
  unit: string;
  name: string;
  position: string;
  isReady: boolean;
}

interface ReadinessCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  issueTitle: string;
  delegates: Delegate[];
}

export const ReadinessCheckModal: React.FC<ReadinessCheckModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  issueTitle,
  delegates,
}) => {
  if (!isOpen) return null;

  const totalCount = delegates.length;
  const readyCount = delegates.filter((d) => d.isReady).length;
  const notReadyCount = totalCount - readyCount;

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
          <h3 className="text-lg btn-primary text-gray-900">
            Kiểm tra trạng thái sẵn sàng
          </h3>
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

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 rounded-xl">
              <CardContent className="p-4">
                <p className="text-sm body text-blue-700 mb-1">Tổng số</p>
                <p className="text-3xl heading text-blue-900">{totalCount}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 rounded-xl">
              <CardContent className="p-4">
                <p className="text-sm body text-green-700 mb-1">Sẵn sàng</p>
                <p className="text-3xl heading text-green-900">{readyCount}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 rounded-xl">
              <CardContent className="p-4">
                <p className="text-sm body text-red-700 mb-1">
                  Chưa sẵn sàng
                </p>
                <p className="text-3xl heading text-red-900">{notReadyCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Delegates Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 btn-primary text-gray-600 w-16 text-center">
                    STT
                  </th>
                  <th className="py-3 px-4 btn-primary text-gray-600">
                    Tên đơn vị
                  </th>
                  <th className="py-3 px-4 btn-primary text-gray-600">
                    Tên đại biểu
                  </th>
                  <th className="py-3 px-4 btn-primary text-gray-600">
                    Chức vụ
                  </th>
                  <th className="py-3 px-4 btn-primary text-gray-600 text-center">
                    Trạng thái sẵn sàng
                  </th>
                </tr>
              </thead>
              <tbody>
                {delegates.map((delegate, index) => (
                  <tr
                    key={delegate.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-gray-700">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{delegate.unit}</td>
                    <td className="py-3 px-4 text-gray-900 body">
                      {delegate.name}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{delegate.position}</td>
                    <td className="py-3 px-4 text-center">
                      {delegate.isReady ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">
                          Sẵn sàng
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-3 py-1 text-xs rounded-full border-none">
                          Chưa sẵn sàng
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Đóng
          </Button>
          <Button
            onClick={onProceed}
            className="bg-[#C8102E] hover:bg-[#a80d26]"
          >
            Tiến hành biểu quyết
          </Button>
        </div>
      </div>
    </div>
  );
};

export type { Delegate };
