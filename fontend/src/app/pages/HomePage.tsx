import React, { useState } from 'react';
import { Clock, MapPin, User, Calendar } from 'lucide-react';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';

interface MeetingItem {
  id: number;
  name: string;
  time: string;
  chairperson: string;
  room: string;
  status: 'ongoing' | 'upcoming' | 'unconfirmed';
  hasParticipated?: boolean;
}

interface ApprovalMeeting {
  id: number;
  name: string;
  time: string;
  chairperson: string;
}

interface DocumentMeeting {
  id: number;
  name: string;
  time: string;
  documentStatus: 'missing' | 'preparing';
}

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming' | 'unconfirmed'>('ongoing');

  // Statistics
  const stats = [
    {
      label: 'Phiên họp đang diễn ra',
      value: 1,
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100/50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
    },
    {
      label: 'Phiên họp sắp diễn ra',
      value: 5,
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      label: 'Phiên họp chưa xác nhận',
      value: 3,
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700',
    },
    {
      label: 'Tổng số phiếu lấy ý kiến',
      value: 12,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
    },
  ];

  // Mock data for meetings
  const allMeetings: MeetingItem[] = [
    {
      id: 1,
      name: 'Phiên họp HĐND tỉnh Quảng Ninh lần thứ 18',
      time: '09:00 - 11:30, 20/04/2026',
      chairperson: 'Nguyễn Văn A',
      room: 'Phòng họp Hội đồng tỉnh',
      status: 'ongoing',
    },
    {
      id: 2,
      name: 'Phiên họp UBND tỉnh Quảng Ninh về Kế hoạch đầu tư công Quý 2',
      time: '14:00 - 16:00, 22/04/2026',
      chairperson: 'Trần Thị B',
      room: 'Phòng họp A - Tầng 5',
      status: 'upcoming',
      hasParticipated: true,
    },
    {
      id: 3,
      name: 'Phiên họp Ban Thường vụ Tỉnh ủy lần thứ 25',
      time: '08:30 - 12:00, 25/04/2026',
      chairperson: 'Lê Văn C',
      room: 'Hội trường Tỉnh ủy',
      status: 'upcoming',
      hasParticipated: true,
    },
    {
      id: 4,
      name: 'Phiên họp chuyên đề về phát triển du lịch bền vững',
      time: '09:00 - 11:00, 28/04/2026',
      chairperson: 'Phạm Thị D',
      room: 'Phòng họp B - Tầng 3',
      status: 'unconfirmed',
      hasParticipated: false,
    },
    {
      id: 5,
      name: 'Phiên họp về triển khai dự án hạ tầng giao thông',
      time: '14:30 - 17:00, 30/04/2026',
      chairperson: 'Hoàng Văn E',
      room: 'Phòng họp C - Tầng 2',
      status: 'unconfirmed',
      hasParticipated: false,
    },
    {
      id: 6,
      name: 'Phiên họp về công tác phòng chống tham nhũng',
      time: '09:30 - 11:30, 23/04/2026',
      chairperson: 'Vũ Văn F',
      room: 'Phòng họp D - Tầng 4',
      status: 'upcoming',
      hasParticipated: true,
    },
    {
      id: 7,
      name: 'Phiên họp triển khai chương trình xây dựng nông thôn mới',
      time: '14:00 - 16:30, 26/04/2026',
      chairperson: 'Đặng Thị G',
      room: 'Hội trường UBND huyện',
      status: 'upcoming',
      hasParticipated: false,
    },
    {
      id: 8,
      name: 'Phiên họp về chính sách hỗ trợ doanh nghiệp SME',
      time: '08:00 - 10:00, 29/04/2026',
      chairperson: 'Bùi Văn H',
      room: 'Phòng họp E - Tầng 6',
      status: 'unconfirmed',
      hasParticipated: false,
    },  {
      id: 9,
      name: 'Phiên họp HĐND tỉnh Quảng Ninh lần thứ 18',
      time: '09:00 - 11:30, 20/04/2026',
      chairperson: 'Nguyễn Văn A',
      room: 'Phòng họp Hội đồng tỉnh',
      status: 'ongoing',
    },
    {
      id: 10,
      name: 'Phiên họp UBND tỉnh Quảng Ninh về Kế hoạch đầu tư công Quý 2',
      time: '14:00 - 16:00, 22/04/2026',
      chairperson: 'Trần Thị B',
      room: 'Phòng họp A - Tầng 5',
      status: 'upcoming',
      hasParticipated: true,
    },
    {
      id: 11,
      name: 'Phiên họp Ban Thường vụ Tỉnh ủy lần thứ 25',
      time: '08:30 - 12:00, 25/04/2026',
      chairperson: 'Lê Văn C',
      room: 'Hội trường Tỉnh ủy',
      status: 'upcoming',
      hasParticipated: true,
    },
    {
      id: 12,
      name: 'Phiên họp chuyên đề về phát triển du lịch bền vững',
      time: '09:00 - 11:00, 28/04/2026',
      chairperson: 'Phạm Thị D',
      room: 'Phòng họp B - Tầng 3',
      status: 'unconfirmed',
      hasParticipated: false,
    },
    {
      id: 13,
      name: 'Phiên họp về triển khai dự án hạ tầng giao thông',
      time: '14:30 - 17:00, 30/04/2026',
      chairperson: 'Hoàng Văn E',
      room: 'Phòng họp C - Tầng 2',
      status: 'unconfirmed',
      hasParticipated: false,
    },
    {
      id: 14,
      name: 'Phiên họp về công tác phòng chống tham nhũng',
      time: '09:30 - 11:30, 23/04/2026',
      chairperson: 'Vũ Văn F',
      room: 'Phòng họp D - Tầng 4',
      status: 'upcoming',
      hasParticipated: true,
    },
    {
      id: 15,
      name: 'Phiên họp triển khai chương trình xây dựng nông thôn mới',
      time: '14:00 - 16:30, 26/04/2026',
      chairperson: 'Đặng Thị G',
      room: 'Hội trường UBND huyện',
      status: 'upcoming',
      hasParticipated: false,
    },
    {
      id: 16,
      name: 'Phiên họp về chính sách hỗ trợ doanh nghiệp SME',
      time: '08:00 - 10:00, 29/04/2026',
      chairperson: 'Bùi Văn H',
      room: 'Phòng họp E - Tầng 6',
      status: 'unconfirmed',
      hasParticipated: false,
    },
  ];

  const filteredMeetings = allMeetings.filter((m) => m.status === activeTab);

  // Mock data for approval meetings
  const approvalMeetings: ApprovalMeeting[] = [
    {
      id: 101,
      name: 'Phiên họp UBND tỉnh về quy hoạch đô thị',
      time: '15:00, 21/04/2026',
      chairperson: 'Nguyễn Văn X',
    },
    {
      id: 102,
      name: 'Phiên họp xét duyệt dự án đầu tư hạ tầng khu công nghiệp',
      time: '09:00, 23/04/2026',
      chairperson: 'Trần Thị Y',
    },
    {
      id: 103,
      name: 'Phiên họp Ban Chấp hành về công tác tổ chức',
      time: '14:00, 24/04/2026',
      chairperson: 'Lê Văn Z',
    },
  ];

  // Mock data for document meetings
  const documentMeetings: DocumentMeeting[] = [
    {
      id: 201,
      name: 'Phiên họp HĐND về ngân sách năm 2026',
      time: '08:30, 22/04/2026',
      documentStatus: 'missing',
    },
    {
      id: 202,
      name: 'Phiên họp chuyên đề về giáo dục',
      time: '10:00, 25/04/2026',
      documentStatus: 'preparing',
    },
    {
      id: 203,
      name: 'Phiên họp về chính sách y tế cơ sở',
      time: '14:30, 27/04/2026',
      documentStatus: 'missing',
    },
    {
      id: 204,
      name: 'Phiên họp Ban Thường vụ về công tác tuyên truyền',
      time: '09:00, 29/04/2026',
      documentStatus: 'preparing',
    },
  ];

  const MeetingCard = ({ meeting }: { meeting: MeetingItem }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
      <div className="space-y-4">
        {/* Title and Badge */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base btn-primary text-gray-900 flex-1 line-clamp-2">
            {meeting.name}
          </h4>
          {meeting.status === 'ongoing' && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shrink-0">
              Đang diễn ra
            </Badge>
          )}
          {meeting.status === 'upcoming' && meeting.hasParticipated && (
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shrink-0">
              Có tham gia
            </Badge>
          )}
          {meeting.status === 'unconfirmed' && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 shrink-0">
              Chưa xác nhận
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="truncate">{meeting.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">Chủ trì: {meeting.chairperson}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{meeting.room}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {(meeting.status === 'upcoming' || meeting.status === 'unconfirmed') && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              className="text-xs px-3 py-1.5 h-auto border-gray-300"
            >
              Thêm góp ý
            </Button>
            <Button
              className="text-xs px-3 py-1.5 h-auto bg-[#C8102E] hover:bg-[#a80d26]"
            >
              Xác nhận tham gia
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/30 min-h-screen">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Statistics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} border ${stat.borderColor} rounded-2xl p-6 transition-all hover:shadow-md`}
            >
              <div className="text-center">
                <p className={`text-5xl heading ${stat.textColor} mb-2`}>{stat.value}</p>
                <p className="text-sm body text-gray-600">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Meeting List (70%) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:h-[850px]">
              {/* Tabs Header */}
              <div className="border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-1 p-2">
                  <button
                    onClick={() => setActiveTab('ongoing')}
                    className={`flex-1 px-4 py-3 text-sm body rounded-xl transition-all ${
                      activeTab === 'ongoing'
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Đang diễn ra ({allMeetings.filter((m) => m.status === 'ongoing').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex-1 px-4 py-3 text-sm body rounded-xl transition-all ${
                      activeTab === 'upcoming'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Sắp diễn ra ({allMeetings.filter((m) => m.status === 'upcoming').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('unconfirmed')}
                    className={`flex-1 px-4 py-3 text-sm body rounded-xl transition-all ${
                      activeTab === 'unconfirmed'
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Chưa xác nhận ({allMeetings.filter((m) => m.status === 'unconfirmed').length})
                  </button>
                </div>
              </div>

              {/* Meeting List */}
              <div className="flex-1 overflow-hidden p-6">
                {filteredMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm body text-gray-900 mb-1">Không có dữ liệu</p>
                    <p className="text-sm text-gray-500">Chưa có phiên họp nào</p>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {filteredMeetings.map((meeting) => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Cards (30%) */}
          <div className="space-y-6">
            {/* Approval Meetings Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[400px]">
              <div className="px-6 py-4 border-b border-gray-200 shrink-0">
                <h3 className="text-base btn-primary text-gray-900">Cuộc họp cần phê duyệt</h3>
                <p className="text-sm text-gray-500 mt-1">{approvalMeetings.length} phiên họp</p>
              </div>
              <div className="flex-1 overflow-hidden p-6">
                <div className="h-full overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {approvalMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm btn-primary text-gray-900 line-clamp-2 flex-1">
                            {meeting.name}
                          </h4>
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 shrink-0 text-xs">
                            Chờ phê duyệt
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{meeting.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">Chủ trì: {meeting.chairperson}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button className="text-xs px-3 py-1.5 h-auto bg-[#C8102E] hover:bg-[#a80d26] flex-1">
                            Phê duyệt
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs px-3 py-1.5 h-auto border-gray-300 flex-1"
                          >
                            Xem chi tiết
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Meetings Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[426px]">
              <div className="px-6 py-4 border-b border-gray-200 shrink-0">
                <h3 className="text-base btn-primary text-gray-900">Cuộc họp cần chuẩn bị tài liệu</h3>
                <p className="text-sm text-gray-500 mt-1">{documentMeetings.length} phiên họp</p>
              </div>
              <div className="flex-1 overflow-hidden p-6">
                <div className="h-full overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {documentMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm btn-primary text-gray-900 line-clamp-2 flex-1">
                            {meeting.name}
                          </h4>
                          <Badge
                            className={`shrink-0 text-xs ${
                              meeting.documentStatus === 'missing'
                                ? 'bg-red-100 text-red-700 hover:bg-red-100'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            {meeting.documentStatus === 'missing' ? 'Chưa có' : 'Đang chuẩn bị'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{meeting.time}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button className="text-xs px-3 py-1.5 h-auto bg-[#C8102E] hover:bg-[#a80d26] flex-1">
                            Tải lên tài liệu
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs px-3 py-1.5 h-auto border-gray-300"
                          >
                            Xem
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
