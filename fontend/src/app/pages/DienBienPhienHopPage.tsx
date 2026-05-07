import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Clock,
  Download,
  FileText,
  Users,
  Eye,
  ChevronDown,
  Plus,
  User,
  X,
  CheckCircle,
  PlayCircle,
  MessageSquarePlus,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../components/ui/hp-button';
import { Card, CardContent } from '../components/ui/hp-card';
import { Badge } from '../components/ui/hp-badge';
import { PageHeader } from '../components/layout/PageHeader';
import { Sidebar, SidebarItem } from '../components/layout/Sidebar';
import { CollapsibleSection } from '../components/meeting/CollapsibleSection';
import { AttendanceModal } from '../components/meeting/AttendanceModal';
import { AddOpinionModal, OpinionData } from '../components/meeting/AddOpinionModal';
import { SpeakerActionMenu } from '../components/meeting/SpeakerActionMenu';
import { SelectSpeakerModal, Participant } from '../components/meeting/SelectSpeakerModal';
import { StartContentModal, MeetingContent } from '../components/meeting/StartContentModal';
import { ApproveContentModal } from '../components/meeting/ApproveContentModal';
import { AddOpinionForContentModal, OpinionForContentData } from '../components/meeting/AddOpinionForContentModal';
import { TestModal } from '../components/meeting/TestModal';
import { ConfirmBroadcastModal } from '../components/meeting/voting/ConfirmBroadcastModal';
import { ReadinessCheckModal, Delegate } from '../components/meeting/voting/ReadinessCheckModal';
import { VotingTimeModal } from '../components/meeting/voting/VotingTimeModal';
import { VotingModal } from '../components/meeting/voting/VotingModal';
import { PauseVotingModal } from '../components/meeting/voting/PauseVotingModal';
import { VotingResultModal, VotingResult, VotedDelegate, NotVotedDelegate } from '../components/meeting/voting/VotingResultModal';

const sidebarItems: SidebarItem[] = [
  { name: 'Tất cả phiên họp', path: '/phien-hop', badge: '30' },
];

interface Speaker {
  id: number;
  name: string;
  position: string;
  unit: string;
  note?: string;
  startTime?: string;
  status: 'waiting' | 'speaking' | 'finished';
  addedTime: string;
}

interface Opinion {
  id: number;
  userName: string;
  userPosition: string;
  documentName?: string;
  opinionDetail: string;
  attachments: { name: string; size: number }[];
  createdAt: string;
}

interface VotingIssue {
  id: number;
  issue: string;
  time: string;
  status: 'pending' | 'broadcasting' | 'voting' | 'paused' | 'completed';
  broadcastEnabled: boolean;
  votingDuration?: number;
}

export default function DienBienPhienHopPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeContent, setActiveContent] = useState(1);
  const [activeTab, setActiveTab] = useState<'cho' | 'bac-bo'>('cho');
  const [isAddSpeakerModalOpen, setIsAddSpeakerModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isAddOpinionModalOpen, setIsAddOpinionModalOpen] = useState(false);
  const [isStartContentModalOpen, setIsStartContentModalOpen] = useState(false);
  const [isApproveContentModalOpen, setIsApproveContentModalOpen] = useState(false);
  const [isAddOpinionForContentModalOpen, setIsAddOpinionForContentModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<MeetingContent | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Voting modal states
  const [currentVotingIssue, setCurrentVotingIssue] = useState<VotingIssue | null>(null);
  const [isConfirmBroadcastModalOpen, setIsConfirmBroadcastModalOpen] = useState(false);
  const [isReadinessCheckModalOpen, setIsReadinessCheckModalOpen] = useState(false);
  const [isVotingTimeModalOpen, setIsVotingTimeModalOpen] = useState(false);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [isPauseVotingModalOpen, setIsPauseVotingModalOpen] = useState(false);
  const [isVotingResultModalOpen, setIsVotingResultModalOpen] = useState(false);
  const [votingResultData, setVotingResultData] = useState<{
    results: VotingResult;
    votedDelegates: VotedDelegate[];
    notVotedDelegates: NotVotedDelegate[];
  } | null>(null);

  // Danh sách góp ý
  const [opinions, setOpinions] = useState<Opinion[]>([]);

  // Danh sách vấn đề cần biểu quyết
  const [votingIssues, setVotingIssues] = useState<VotingIssue[]>([
    {
      id: 1,
      issue: 'Giải trình về việc cơ quan nhà nước cung cấp, giải thích, làm rõ thông tin liên quan đến dự án đầu tư công',
      time: '10:00:00',
      status: 'pending',
      broadcastEnabled: false,
    },
  ]);

  // Mock delegates data
  const mockDelegates: Delegate[] = [
    { id: 1, unit: 'Sở Kế hoạch và Đầu tư', name: 'Nguyễn Văn A', position: 'Giám đốc', isReady: true },
    { id: 2, unit: 'Sở Tài chính', name: 'Trần Thị B', position: 'Phó Giám đốc', isReady: true },
    { id: 3, unit: 'Sở Xây dựng', name: 'Lê Văn C', position: 'Trưởng phòng', isReady: false },
    { id: 4, unit: 'Sở Giáo dục', name: 'Phạm Thị D', position: 'Giám đốc', isReady: true },
    { id: 5, unit: 'Sở Y tế', name: 'Hoàng Văn E', position: 'Phó Giám đốc', isReady: true },
  ];

  // Mock danh sách người tham gia cuộc họp
  const meetingParticipants: Participant[] = [
    {
      id: 'p-1',
      name: 'Nguyễn Văn A',
      position: 'Phó Chủ tịch UBND',
      unit: 'Sở Kế hoạch và Đầu tư',
      attendanceStatus: 'Tham gia',
      type: 'individual',
    },
    {
      id: 'p-2',
      name: 'Trần Thị B',
      position: 'Trưởng phòng',
      unit: 'Sở Tài chính',
      attendanceStatus: 'Tham gia',
      type: 'unit',
    },
    {
      id: 'p-3',
      name: 'Lê Văn C',
      position: 'Chuyên viên',
      unit: 'Sở Xây dựng',
      attendanceStatus: 'Tham gia',
      type: 'individual',
    },
    {
      id: 'p-4',
      name: 'Phạm Thị D',
      position: 'Giám đốc',
      unit: 'Sở Giáo dục',
      attendanceStatus: 'Tham gia',
      type: 'unit',
    },
    {
      id: 'p-5',
      name: 'Hoàng Văn E',
      position: 'Cố vấn',
      unit: 'Công ty ABC',
      attendanceStatus: 'Khách mời',
      type: 'guest',
    },
  ];

  // Danh sách người phát biểu
  const [speakers, setSpeakers] = useState<Speaker[]>([
    {
      id: 1,
      name: 'Nguyễn Văn A',
      position: 'Phó Chủ tịch UBND',
      unit: 'Sở Kế hoạch và Đầu tư',
      startTime: '17/04/2026 22:40',
      status: 'speaking',
      addedTime: '17/04/2026 22:35',
    },
  ]);

  // Người đang phát biểu
  const currentSpeaker = speakers.find((s) => s.status === 'speaking');

  // Danh sách chờ phát biểu
  const waitingSpeakers = speakers.filter((s) => s.status === 'waiting');

  // Thêm người phát biểu mới từ danh sách tham gia
  const handleAddSpeakers = (selectedParticipants: Participant[]) => {
    const newSpeakers: Speaker[] = selectedParticipants.map((participant, index) => ({
      id: Date.now() + index,
      name: participant.name,
      position: participant.position,
      unit: participant.unit,
      note: '',
      status: currentSpeaker || index > 0 ? 'waiting' : 'speaking',
      addedTime: new Date().toLocaleString('vi-VN'),
      startTime:
        !currentSpeaker && index === 0 ? new Date().toLocaleString('vi-VN') : undefined,
    }));

    // Nếu không có người phát biểu, người đầu tiên sẽ phát biểu ngay
    // Còn lại vào hàng chờ
    setSpeakers([...speakers, ...newSpeakers]);
    setIsAddSpeakerModalOpen(false);
  };

  // Kết thúc phát biểu
  const handleEndSpeaking = () => {
    if (!currentSpeaker) return;

    const updatedSpeakers = speakers.map((s) => {
      if (s.id === currentSpeaker.id) {
        return { ...s, status: 'finished' as const };
      }
      return s;
    });

    // Chuyển người đầu tiên trong hàng chờ lên phát biểu
    const nextSpeaker = waitingSpeakers[0];
    if (nextSpeaker) {
      const finalSpeakers = updatedSpeakers.map((s) => {
        if (s.id === nextSpeaker.id) {
          return {
            ...s,
            status: 'speaking' as const,
            startTime: new Date().toLocaleString('vi-VN'),
          };
        }
        return s;
      });
      setSpeakers(finalSpeakers);
    } else {
      setSpeakers(updatedSpeakers);
    }
  };

  // Danh sách tài liệu cho dropdown
  const availableDocuments = [
    { value: 'doc-1', label: 'Báo cáo tình hình kinh tế - xã hội Quý 1.pdf' },
    { value: 'doc-2', label: 'Kế hoạch triển khai Quý 2 chi tiết.docx' },
  ];

  // Thêm góp ý mới
  const handleAddOpinion = (data: OpinionData) => {
    // Mock user data - trong thực tế lấy từ session/auth
    const currentUser = {
      name: 'Nguyễn Văn B',
      position: 'Phó Giám đốc Sở',
    };

    const documentName = data.documentId
      ? availableDocuments.find((doc) => doc.value === data.documentId)?.label
      : undefined;

    const newOpinion: Opinion = {
      id: Date.now(),
      userName: currentUser.name,
      userPosition: currentUser.position,
      documentName,
      opinionDetail: data.opinionDetail,
      attachments: data.attachments.map((file) => ({
        name: file.name,
        size: file.size,
      })),
      createdAt: new Date().toLocaleString('vi-VN'),
    };

    setOpinions([...opinions, newOpinion]);
    setIsAddOpinionModalOpen(false);

    console.log('Added opinion:', newOpinion);
    // TODO: Gọi API tạo góp ý với payload:
    // - meetingId: id
    // - documentId: data.documentId
    // - opinionDetail: data.opinionDetail
    // - attachments: data.attachments (upload files)
  };

  // Handlers cho Speaker Actions
  const handlePrepareSpeech = (speakerId: number) => {
    console.log('Chuẩn bị phát biểu cho speaker:', speakerId);
    // TODO: Gọi API hoặc cập nhật trạng thái speaker sang "Đang chuẩn bị"
    alert(`Chuẩn bị phát biểu cho người phát biểu #${speakerId}`);
  };

  const handleAssignSpeech = (speakerId: number) => {
    console.log('Chỉ định phát biểu cho speaker:', speakerId);
    // TODO: Gọi API hoặc cập nhật trạng thái speaker sang "Được chỉ định"
    alert(`Chỉ định phát biểu cho người phát biểu #${speakerId}`);
  };

  const handleRejectSpeech = (speakerId: number) => {
    console.log('Bác bỏ phát biểu cho speaker:', speakerId);
    // TODO: Xác nhận và gọi API bác bỏ
    const confirmReject = window.confirm('Bạn có chắc chắn muốn bác bỏ phát biểu này?');
    if (confirmReject) {
      // Xóa speaker khỏi danh sách hoặc cập nhật trạng thái
      setSpeakers(speakers.filter((s) => s.id !== speakerId));
      alert(`Đã bác bỏ phát biểu #${speakerId}`);
    }
  };

  // Handlers cho voting issues
  const handleToggleBroadcast = (issueId: number) => {
    const issue = votingIssues.find((i) => i.id === issueId);
    if (!issue) return;

    // Nếu đang bật, mở modal xác nhận phát lệnh
    if (!issue.broadcastEnabled) {
      setCurrentVotingIssue(issue);
      setIsConfirmBroadcastModalOpen(true);
    } else {
      // Nếu đang tắt, tắt broadcast
      setVotingIssues(
        votingIssues.map((i) =>
          i.id === issueId ? { ...i, broadcastEnabled: false } : i
        )
      );
    }
  };

  const handleConfirmBroadcast = (checkReadiness: boolean) => {
    if (!currentVotingIssue) return;

    // Cập nhật trạng thái broadcasting
    setVotingIssues(
      votingIssues.map((i) =>
        i.id === currentVotingIssue.id
          ? { ...i, broadcastEnabled: true, status: 'broadcasting' as const }
          : i
      )
    );

    setIsConfirmBroadcastModalOpen(false);

    // Nếu checkbox kiểm tra sẵn sàng được chọn, mở modal kiểm tra
    if (checkReadiness) {
      setIsReadinessCheckModalOpen(true);
    } else {
      // Nếu không, chuyển thẳng đến nhập thời gian
      setIsVotingTimeModalOpen(true);
    }
  };

  const handleProceedFromReadiness = () => {
    setIsReadinessCheckModalOpen(false);
    setIsVotingTimeModalOpen(true);
  };

  const handleConfirmVotingTime = (minutes: number) => {
    if (!currentVotingIssue) return;

    // Cập nhật thời gian biểu quyết
    setVotingIssues(
      votingIssues.map((i) =>
        i.id === currentVotingIssue.id
          ? { ...i, votingDuration: minutes, status: 'voting' as const }
          : i
      )
    );

    setIsVotingTimeModalOpen(false);
    setIsVotingModalOpen(true);
  };

  const handleVote = (option: 'agree' | 'disagree' | 'other', otherContent?: string) => {
    console.log('Voted:', option, otherContent);
    const voteText = option === 'agree'
      ? 'Đồng ý'
      : option === 'disagree'
      ? 'Không đồng ý'
      : `Ý kiến khác: ${otherContent}`;
    alert(`Đã biểu quyết: ${voteText}`);
    setIsVotingModalOpen(false);
  };

  const handlePauseVoting = (issueId: number) => {
    const issue = votingIssues.find((i) => i.id === issueId);
    if (!issue) return;

    setCurrentVotingIssue(issue);
    setIsPauseVotingModalOpen(true);
  };

  const handleConfirmPause = () => {
    if (!currentVotingIssue) return;

    setVotingIssues(
      votingIssues.map((i) =>
        i.id === currentVotingIssue.id ? { ...i, status: 'paused' as const } : i
      )
    );

    setIsPauseVotingModalOpen(false);
    setCurrentVotingIssue(null);
  };

  const handleRevote = (issueId: number) => {
    const issue = votingIssues.find((i) => i.id === issueId);
    if (!issue) return;

    setCurrentVotingIssue(issue);
    setIsVotingModalOpen(true);
  };

  const handleViewVotingResult = (issueId: number) => {
    // Mock voting results data
    const mockVotingResults: VotingResult = {
      agree: 35,
      disagree: 8,
      other: 5,
      notVoted: 12,
    };

    const mockVotedDelegates: VotedDelegate[] = [
      {
        id: 1,
        name: 'Nguyễn Văn A',
        position: 'Giám đốc',
        unit: 'Sở Kế hoạch và Đầu tư',
        vote: 'agree',
      },
      {
        id: 2,
        name: 'Trần Thị B',
        position: 'Phó Giám đốc',
        unit: 'Sở Tài chính',
        vote: 'agree',
      },
      {
        id: 3,
        name: 'Lê Văn C',
        position: 'Trưởng phòng',
        unit: 'Sở Xây dựng',
        vote: 'disagree',
      },
      {
        id: 4,
        name: 'Phạm Thị D',
        position: 'Giám đốc',
        unit: 'Sở Giáo dục',
        vote: 'agree',
      },
      {
        id: 5,
        name: 'Hoàng Văn E',
        position: 'Phó Giám đốc',
        unit: 'Sở Y tế',
        vote: 'other',
        otherContent: 'Đề nghị bổ sung thêm khoản ngân sách dự phòng',
      },
      {
        id: 6,
        name: 'Ngô Thị F',
        position: 'Chuyên viên',
        unit: 'Sở Nông nghiệp',
        vote: 'agree',
      },
      {
        id: 7,
        name: 'Vũ Văn G',
        position: 'Trưởng phòng',
        unit: 'Sở Công thương',
        vote: 'disagree',
      },
      {
        id: 8,
        name: 'Đặng Thị H',
        position: 'Phó Giám đốc',
        unit: 'Sở Văn hóa',
        vote: 'agree',
      },
    ];

    const mockNotVotedDelegates: NotVotedDelegate[] = [
      {
        id: 9,
        name: 'Bùi Văn I',
        position: 'Giám đốc',
        unit: 'Sở Thông tin và Truyền thông',
      },
      {
        id: 10,
        name: 'Đinh Thị K',
        position: 'Trưởng phòng',
        unit: 'Sở Khoa học và Công nghệ',
      },
      {
        id: 11,
        name: 'Hồ Văn L',
        position: 'Phó Giám đốc',
        unit: 'Sở Lao động',
      },
      {
        id: 12,
        name: 'Mai Thị M',
        position: 'Chuyên viên',
        unit: 'Sở Tư pháp',
      },
    ];

    setVotingResultData({
      results: mockVotingResults,
      votedDelegates: mockVotedDelegates,
      notVotedDelegates: mockNotVotedDelegates,
    });
    setIsVotingResultModalOpen(true);
  };

  // Mock data for meeting contents
  const meetingContents: MeetingContent[] = [
    {
      id: 1,
      title: 'Nội dung 1',
      description: 'Báo cáo tình hình kinh tế - xã hội Quý 1/2026',
    },
    {
      id: 2,
      title: 'Nội dung 2',
      description: 'Kế hoạch triển khai công việc Quý 2/2026',
    },
  ];

  const availableContents = meetingContents.map((content) => ({
    value: content.id.toString(),
    label: content.title,
  }));

  // Handlers for content actions
  const handleStartContent = (contentId: number) => {
    console.log('Bắt đầu nội dung:', contentId);
    // TODO: Gọi API cập nhật trạng thái nội dung
    alert(`Đã bắt đầu nội dung #${contentId}`);
  };

  const handleApproveContent = (contentId: number, isApproved: boolean) => {
    console.log('Phê duyệt nội dung:', contentId, isApproved);
    // TODO: Gọi API cập nhật trạng thái phê duyệt
    if (isApproved) {
      alert(`Đã phê duyệt nội dung #${contentId}`);
    } else {
      alert(`Đã từ chối phê duyệt nội dung #${contentId}`);
    }
  };

  const handleAddOpinionForContent = (data: OpinionForContentData) => {
    console.log('Thêm góp ý cho nội dung:', data);
    // TODO: Gọi API tạo góp ý
    alert(`Đã thêm góp ý cho nội dung ${data.contentId}`);
    setIsAddOpinionForContentModalOpen(false);
  };

  const handleOpenStartContent = () => {
    const content = meetingContents.find((c) => c.id === activeContent);
    setSelectedContent(content || null);
    setIsStartContentModalOpen(true);
  };

  const handleOpenApproveContent = () => {
    setIsApproveContentModalOpen(true);
  };

  const handleOpenAddOpinionForContent = () => {
    setIsAddOpinionForContentModalOpen(true);
  };

  return (
    <div className="flex">
      <Sidebar title="Phiên họp" items={sidebarItems} />

      <main className="flex-1 ml-60 p-8">
        <PageHeader
          title={
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate(`/phien-hop/${id}`)}
                className="text-gray-600 hover:text-[#C8102E] hover:bg-red-50 px-2 py-2 h-auto"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span>Diễn biến phiên họp</span>
            </div>
          }
          description={
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>Thời gian: 17/04/2026 22:31 - 23:20</span>
              </div>
            </div>
          }
          breadcrumbs={[
            { name: 'Trang chủ', path: '/' },
            { name: 'Phiên họp', path: '/phien-hop' },
            { name: 'Chi tiết phiên họp', path: `/phien-hop/${id}` },
            { name: 'Diễn biến phiên họp' },
          ]}
          actions={
            <Button
              variant="primary"
              className="bg-[#C8102E] hover:bg-[#a80d26]"
              onClick={() => setIsAttendanceModalOpen(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Điểm danh
            </Button>
          }
        />

        {/* Tên phiên họp */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 uppercase mb-1">
            HỌP TRIỂN KHAI KẾ HOẠCH QUÝ II/2026
          </h2>
        </div>

        {/* Layout 3 cột */}
        <div className="grid grid-cols-12 gap-5 mb-6">
          {/* Cột trái - 2 card xếp dọc */}
          <div className="col-span-3 flex flex-col gap-5">
            {/* Nội dung họp */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <CardContent className="p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Nội dung họp
                </h3>
                <div className="space-y-2">
                  {meetingContents.map((content) => (
                    <div
                      key={content.id}
                      onClick={() => setActiveContent(content.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeContent === content.id
                          ? 'bg-red-50 border border-[#C8102E] text-[#C8102E]'
                          : 'bg-gray-50 border border-transparent text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <p className="text-sm font-medium">{content.title}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lịch sử phiên họp */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1">
              <CardContent className="p-5 h-full flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Lịch sử phiên họp
                </h3>
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                  <FileText className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">Không có dữ liệu</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cột giữa - card lớn hơn */}
          <div className="col-span-5 flex flex-col">
            {/* Thông tin chi tiết phiên họp + Tài liệu đính kèm + Action buttons */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <CardContent className="p-5 space-y-6">
                {/* Nội dung đang được chọn */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    {meetingContents.find((c) => c.id === activeContent)?.title}
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      {meetingContents.find((c) => c.id === activeContent)?.description}
                    </p>
                  </div>
                </div>

                {/* Thông tin chi tiết */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Thông tin chi tiết phiên họp
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start justify-between">
                      <span className="text-gray-500 font-medium">Chủ trì:</span>
                      <span className="text-gray-900 font-medium">
                        Ông Trần Văn A - Bí thư
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-gray-500 font-medium">
                        Người duyệt tài liệu:
                      </span>
                      <span className="text-gray-900 font-medium">Trần Văn C</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-gray-500 font-medium">Trạng thái:</span>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">
                        Đang họp
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Tài liệu đính kèm */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Tài liệu đính kèm
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#C8102E]">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            Báo cáo tình hình kinh tế - xã hội Quý 1.pdf
                          </p>
                          <p className="text-xs text-gray-500">2.4 MB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-[#C8102E]"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            Kế hoạch triển khai Quý 2 chi tiết.docx
                          </p>
                          <p className="text-xs text-gray-500">1.1 MB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-[#C8102E]"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Content */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      border: '1px solid #16a34a',
                      borderRadius: '9999px',
                      background: 'transparent',
                      color: '#16a34a',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert('Phê duyệt clicked!');
                      setIsApproveContentModalOpen(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Phê duyệt
                  </button>
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      border: '1px solid #2563eb',
                      borderRadius: '9999px',
                      background: 'transparent',
                      color: '#2563eb',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert('Bắt đầu clicked!');
                      const content = meetingContents.find((c) => c.id === activeContent);
                      setSelectedContent(content || null);
                      setIsStartContentModalOpen(true);
                    }}
                  >
                    <PlayCircle className="w-4 h-4" />
                    Bắt đầu
                  </button>
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '9999px',
                      background: '#C8102E',
                      color: 'white',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert('Thêm góp ý clicked!');
                      setIsAddOpinionForContentModalOpen(true);
                    }}
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    Thêm góp ý
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cột phải */}
          <div className="col-span-4 flex flex-col gap-5">
            {/* Thời gian phát biểu còn lại */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Thời gian phát biểu còn lại
                  </h3>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1.5 text-sm rounded-full border-none font-mono font-bold">
                    00:09:44
                  </Badge>
                </div>

                {currentSpeaker ? (
                  <>
                    {/* Avatar placeholder */}
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    </div>

                    {/* Thông tin người phát biểu */}
                    <div className="space-y-2 text-sm text-center mb-4">
                      <p className="text-gray-900 font-semibold">{currentSpeaker.name}</p>
                      <p className="text-gray-600">{currentSpeaker.position}</p>
                      <p className="text-gray-500">{currentSpeaker.unit}</p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-[#C8102E] text-[#C8102E] hover:bg-red-50 font-medium rounded-full"
                      onClick={handleEndSpeaking}
                    >
                      Kết thúc phát biểu
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <User className="w-16 h-16 mb-3 opacity-20" />
                    <p className="text-sm">Chưa có người phát biểu</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danh sách chờ phát biểu */}
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Danh sách chờ phát biểu ({waitingSpeakers.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#C8102E] text-[#C8102E] hover:bg-red-50 h-8 gap-1.5"
                    onClick={() => setIsAddSpeakerModalOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Thêm người phát biểu</span>
                  </Button>
                </div>
                {waitingSpeakers.length > 0 ? (
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {waitingSpeakers.map((speaker, index) => (
                      <div
                        key={speaker.id}
                        className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-500">
                                #{index + 1}
                              </span>
                              <p className="text-sm font-semibold text-gray-900">
                                {speaker.name}
                              </p>
                            </div>
                            <p className="text-xs text-gray-600">{speaker.position}</p>
                            <p className="text-xs text-gray-500">{speaker.unit}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Thêm lúc: {speaker.addedTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <FileText className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm">Không có dữ liệu</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section full width bên dưới */}
        <div className="space-y-6">
          {/* Danh sách vấn đề cần biểu quyết */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CollapsibleSection title={`Danh sách vấn đề cần biểu quyết (${votingIssues.length})`}>
              {votingIssues.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-3 px-4 font-semibold text-gray-600 w-16 text-center">
                          STT
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-600">
                          Vấn đề
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-600 w-32 text-center">
                          Thời gian
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-600 w-40 text-center">
                          Trạng thái
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-600 w-32 text-center">
                          Phát lệnh
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-600 w-28 text-center">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {votingIssues.map((issue, index) => (
                        <tr
                          key={issue.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-center text-gray-700">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-gray-900">
                            <div
                              className="truncate max-w-md"
                              title={issue.issue}
                            >
                              {issue.issue}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-700 font-mono">
                            {issue.time}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {issue.status === 'pending' && (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1 text-xs rounded-full border-none">
                                Chưa biểu quyết
                              </Badge>
                            )}
                            {issue.status === 'broadcasting' && (
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 px-3 py-1 text-xs rounded-full border-none">
                                Đã phát lệnh
                              </Badge>
                            )}
                            {issue.status === 'voting' && (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-3 py-1 text-xs rounded-full border-none">
                                Đang biểu quyết
                              </Badge>
                            )}
                            {issue.status === 'paused' && (
                              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 px-3 py-1 text-xs rounded-full border-none">
                                Tạm dừng
                              </Badge>
                            )}
                            {issue.status === 'completed' && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">
                                Đã hoàn thành
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleBroadcast(issue.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                issue.broadcastEnabled
                                  ? 'bg-[#C8102E] focus:ring-[#C8102E]'
                                  : 'bg-gray-300 focus:ring-gray-400'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  issue.broadcastEnabled
                                    ? 'translate-x-6'
                                    : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Hiển thị thêm icon khi đang voting hoặc paused */}
                              {(issue.status === 'voting' || issue.status === 'paused') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handlePauseVoting(issue.id)}
                                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all"
                                    title="Tạm dừng"
                                  >
                                    <Pause className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRevote(issue.id)}
                                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all"
                                    title="Bỏ phiếu lại"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                </>
                              )}

                              {/* Icon xem kết quả luôn hiển thị */}
                              <button
                                type="button"
                                onClick={() => handleViewVotingResult(issue.id)}
                                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all"
                                title="Xem kết quả"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <FileText className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">Không có dữ liệu</p>
                </div>
              )}
            </CollapsibleSection>
          </Card>

          {/* Danh sách tham gia góp ý */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CollapsibleSection
              title={`Danh sách tham gia góp ý (${opinions.length})`}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#C8102E] hover:bg-[#a80d26] h-9 gap-1.5"
                  onClick={() => setIsAddOpinionModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Thêm</span>
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-3 px-4 font-semibold text-gray-600 w-16 text-center">
                        STT
                      </th>
                      <th className="py-3 px-4 font-semibold text-gray-600">
                        Tên đại biểu
                      </th>
                      <th className="py-3 px-4 font-semibold text-gray-600">
                        Chức vụ
                      </th>
                      <th className="py-3 px-4 font-semibold text-gray-600">
                        Chi tiết góp ý
                      </th>
                      <th className="py-3 px-4 font-semibold text-gray-600 w-32 text-center">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  {opinions.length > 0 && (
                    <tbody>
                      {opinions.map((opinion, index) => (
                        <tr key={opinion.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-center text-gray-700">{index + 1}</td>
                          <td className="py-3 px-4 text-gray-900 font-medium">
                            {opinion.userName}
                          </td>
                          <td className="py-3 px-4 text-gray-700">{opinion.userPosition}</td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {opinion.documentName && (
                                <p className="text-xs text-gray-500">
                                  Tài liệu: {opinion.documentName}
                                </p>
                              )}
                              <p className="text-gray-900">{opinion.opinionDetail}</p>
                              {opinion.attachments.length > 0 && (
                                <p className="text-xs text-blue-600">
                                  {opinion.attachments.length} tài liệu đính kèm
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-500 hover:text-[#C8102E]"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
                {opinions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <FileText className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm">Không có dữ liệu</p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </Card>

          {/* Danh sách phát biểu */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <CollapsibleSection
              title={`Danh sách phát biểu (${speakers.filter(s => s.status === 'speaking' || s.status === 'finished').length})`}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#C8102E] hover:bg-[#a80d26] h-9 gap-1.5"
                  onClick={() => setIsAddSpeakerModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Thêm người phát biểu</span>
                </Button>
              }
            >
              {/* Tabs */}
              <div className="flex items-center gap-6 border-b border-gray-200 mb-4 px-2">
                <button
                  onClick={() => setActiveTab('cho')}
                  className={`pb-3 font-medium text-[15px] border-b-2 transition-colors ${
                    activeTab === 'cho'
                      ? 'border-[#C8102E] text-[#C8102E]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Chờ phát biểu
                </button>
                <button
                  onClick={() => setActiveTab('bac-bo')}
                  className={`pb-3 font-medium text-[15px] border-b-2 transition-colors ${
                    activeTab === 'bac-bo'
                      ? 'border-[#C8102E] text-[#C8102E]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bác bỏ
                </button>
              </div>

              {/* Bảng */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-3 px-4 font-semibold text-gray-600 w-16 text-center">
                        STT
                      </th>
                      <th className="py-3 px-4 font-semibold text-gray-600">
                        Tên đại biểu
                      </th>
                      <th className="py-3 px-4 font-semibold text-gray-600">
                        Chức vụ
                      </th>
                      <th className="py-3 px-4 font-semibold text-gray-600">
                        Ghi chú
                      </th>
                      <th className="py-3 px-4 font-semibold text-gray-600">
                        Thời gian bắt đầu phát biểu
                      </th>
                      <th className="py-3 px-4 font-semibold text-gray-600">
                        Trạng thái
                      </th>
                      <th className="py-3 px-4 font-semibold text-gray-600 w-32 text-center">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {speakers
                      .filter((s) => s.status === 'speaking' || s.status === 'finished')
                      .map((speaker, index) => (
                        <tr key={speaker.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-center text-gray-700">{index + 1}</td>
                          <td className="py-3 px-4 text-gray-900 font-medium">
                            {speaker.name}
                          </td>
                          <td className="py-3 px-4 text-gray-700">{speaker.position}</td>
                          <td className="py-3 px-4 text-gray-700">{speaker.note || '-'}</td>
                          <td className="py-3 px-4 text-gray-700">{speaker.startTime || '-'}</td>
                          <td className="py-3 px-4">
                            {speaker.status === 'speaking' ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs rounded-full border-none">
                                Đang phát biểu
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 px-3 py-1 text-xs rounded-full border-none">
                                Đã kết thúc
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <SpeakerActionMenu
                              speakerId={speaker.id}
                              onPrepare={handlePrepareSpeech}
                              onAssign={handleAssignSpeech}
                              onReject={handleRejectSpeech}
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-end gap-2 mt-4 px-2">
                <span className="text-sm text-gray-600">
                  1-{speakers.filter((s) => s.status === 'speaking' || s.status === 'finished').length} của{' '}
                  {speakers.filter((s) => s.status === 'speaking' || s.status === 'finished').length}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Button>
                </div>
              </div>
            </CollapsibleSection>
          </Card>
        </div>
      </main>

      {/* Modal chọn người phát biểu từ danh sách tham gia */}
      <SelectSpeakerModal
        isOpen={isAddSpeakerModalOpen}
        onClose={() => setIsAddSpeakerModalOpen(false)}
        onSelect={handleAddSpeakers}
        participants={meetingParticipants}
        existingSpeakerIds={speakers.map((s) => s.id)}
        allowMultiple={true}
      />

      {/* Modal điểm danh */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
      />

      {/* Modal thêm góp ý */}
      <AddOpinionModal
        isOpen={isAddOpinionModalOpen}
        onClose={() => setIsAddOpinionModalOpen(false)}
        onAdd={handleAddOpinion}
        documents={availableDocuments}
      />

      {/* INLINE TEST MODALS - Direct render without components */}
      {isStartContentModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
          onClick={() => setIsStartContentModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Xác nhận bắt đầu nội dung
            </h2>
            {selectedContent && (
              <>
                <div
                  style={{
                    backgroundColor: '#dbeafe',
                    border: '1px solid #93c5fd',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <p style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {selectedContent.title}
                  </p>
                  <p style={{ fontSize: '14px', color: '#4b5563' }}>
                    {selectedContent.description}
                  </p>
                </div>
                <div
                  style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fcd34d',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <p style={{ fontSize: '14px', color: '#78350f' }}>
                    Bắt đầu nội dung này sẽ kết thúc những nội dung đang họp khác, bạn
                    có đồng ý không?
                  </p>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setIsStartContentModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (selectedContent) {
                    handleStartContent(selectedContent.id);
                  }
                  setIsStartContentModalOpen(false);
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#C8102E',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {isApproveContentModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
          onClick={() => setIsApproveContentModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Xác nhận phê duyệt nội dung
            </h2>
            <div
              style={{
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <p style={{ fontSize: '14px' }}>
                Xác nhận phê duyệt cho nội dung{' '}
                <strong>
                  "{meetingContents.find((c) => c.id === activeContent)?.title}"
                </strong>
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                }}
              >
                <input type="radio" name="approval" defaultChecked />
                <span>Phê duyệt</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <input type="radio" name="approval" />
                <span>Từ chối phê duyệt</span>
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setIsApproveContentModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  handleApproveContent(activeContent, true);
                  setIsApproveContentModalOpen(false);
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#C8102E',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal bắt đầu nội dung */}
      <StartContentModal
        isOpen={false}
        onClose={() => setIsStartContentModalOpen(false)}
        content={selectedContent}
        onConfirm={handleStartContent}
      />

      {/* Modal phê duyệt nội dung */}
      <ApproveContentModal
        isOpen={false}
        onClose={() => setIsApproveContentModalOpen(false)}
        contentTitle={meetingContents.find((c) => c.id === activeContent)?.title || ''}
        contentId={activeContent}
        onConfirm={handleApproveContent}
      />

      {/* Modal thêm góp ý cho nội dung */}
      <AddOpinionForContentModal
        isOpen={isAddOpinionForContentModalOpen}
        onClose={() => setIsAddOpinionForContentModalOpen(false)}
        onAdd={handleAddOpinionForContent}
        contents={availableContents}
        documents={availableDocuments}
        defaultContentId={activeContent.toString()}
      />

      {/* Voting Modals */}
      <ConfirmBroadcastModal
        isOpen={isConfirmBroadcastModalOpen}
        onClose={() => setIsConfirmBroadcastModalOpen(false)}
        onConfirm={handleConfirmBroadcast}
        issueTitle={currentVotingIssue?.issue || ''}
      />

      <ReadinessCheckModal
        isOpen={isReadinessCheckModalOpen}
        onClose={() => setIsReadinessCheckModalOpen(false)}
        onProceed={handleProceedFromReadiness}
        issueTitle={currentVotingIssue?.issue || ''}
        delegates={mockDelegates}
      />

      <VotingTimeModal
        isOpen={isVotingTimeModalOpen}
        onClose={() => setIsVotingTimeModalOpen(false)}
        onConfirm={handleConfirmVotingTime}
      />

      <VotingModal
        isOpen={isVotingModalOpen}
        onClose={() => setIsVotingModalOpen(false)}
        onVote={handleVote}
        issueTitle={currentVotingIssue?.issue || ''}
        durationMinutes={currentVotingIssue?.votingDuration || 10}
      />

      <PauseVotingModal
        isOpen={isPauseVotingModalOpen}
        onClose={() => setIsPauseVotingModalOpen(false)}
        onConfirm={handleConfirmPause}
        issueTitle={currentVotingIssue?.issue || ''}
      />

      <VotingResultModal
        isOpen={isVotingResultModalOpen}
        onClose={() => setIsVotingResultModalOpen(false)}
        issueTitle={currentVotingIssue?.issue || 'Vấn đề biểu quyết'}
        results={votingResultData?.results || { agree: 0, disagree: 0, other: 0, notVoted: 0 }}
        votedDelegates={votingResultData?.votedDelegates || []}
        notVotedDelegates={votingResultData?.notVotedDelegates || []}
      />
    </div>
  );
}

// Modal component để thêm người phát biểu
interface AddSpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (speaker: { name: string; position: string; unit: string; note?: string }) => void;
}

function AddSpeakerModal({ isOpen, onClose, onAdd }: AddSpeakerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    unit: '',
    note: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.position || !formData.unit) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    onAdd(formData);
    setFormData({ name: '', position: '', unit: '', note: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Thêm người phát biểu</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đại biểu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                placeholder="Nhập tên đại biểu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chức vụ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                placeholder="Nhập chức vụ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn vị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                placeholder="Nhập đơn vị"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] resize-none"
                placeholder="Nhập ghi chú (tùy chọn)"
                rows={3}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 border-gray-300 text-gray-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-4 py-2 bg-[#C8102E] hover:bg-[#a80d26]"
            >
              Thêm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
