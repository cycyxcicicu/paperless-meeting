import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDienBienPhienHop } from '../useDienBienPhienHop';
import { useMeetingState } from '../useMeetingState';
import { useAuth } from '@/app/context/AuthContext';
import { meetingApi } from '../../services/meeting.api';
import { toast } from '@/lib/toast';

// Mock dependencies
vi.mock('../useMeetingState', () => ({
    useMeetingState: vi.fn(),
}));

vi.mock('@/app/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../services/meeting.api', () => ({
    meetingApi: {
        publicUpdateAttendanceStatus: vi.fn(),
        updateAttendanceStatus: vi.fn(),
        publicRequestToSpeak: vi.fn(),
        requestToSpeak: vi.fn(),
        prepareSpeakerTurn: vi.fn(),
        stopSpeakerTurn: vi.fn(),
        startSpeakerTurn: vi.fn(),
        startDirectSpeakerTurn: vi.fn(),
        rejectSpeakRequest: vi.fn(),
        reorderSpeakersQueue: vi.fn(),
        publicCreateOpinion: vi.fn(),
        createOpinion: vi.fn(),
        startVote: vi.fn(),
        stopVote: vi.fn(),
        publicCastVote: vi.fn(),
        castVote: vi.fn(),
        getVoteStatistics: vi.fn(),
        publicGetVoteStatistics: vi.fn(),
        toggleVotingList: vi.fn(),
        startAgenda: vi.fn(),
        approveAgenda: vi.fn(),
    },
}));

vi.mock('@/lib/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock('react-router', () => ({
    useParams: () => ({ id: 'meeting-123' }),
}));

describe('useDienBienPhienHop', () => {
    let mockMeetingState: any;
    let mockUser: any;

    beforeEach(() => {
        vi.clearAllMocks();
        window.confirm = vi.fn(() => true);

        mockUser = { id: 'user-1' };
        (useAuth as any).mockReturnValue({ user: mockUser });

        mockMeetingState = {
            meeting: { id: 'meeting-123', startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
            agendaItems: [
                { id: 'agenda-1', title: 'Nội dung 1', status: 'IN_PROGRESS', durationEst: 15, preparedByFullName: 'Nguyễn Văn A', documents: [] }
            ],
            opinions: [],
            motions: [
                {
                    id: 'motion-1',
                    agendaItemId: 'agenda-1',
                    title: 'Biểu quyết 1',
                    status: 'DRAFT',
                    options: [
                        { id: 'opt-yes', label: 'CÓ', orderNo: 1 },
                        { id: 'opt-no', label: 'KHÔNG', orderNo: 2 },
                        { id: 'opt-other', label: 'Ý KIẾN KHÁC', orderNo: 3 },
                    ]
                }
            ],
            speakersQueue: [],
            attendees: {
                participants: [
                    { userId: 'user-1', id: 'part-1', fullName: 'Delegate 1', participantRole: 'PARTICIPANT', attendanceStatus: 'PRESENT', inviteStatus: 'ACCEPTED' }
                ],
                guests: []
            },
            refreshAll: vi.fn(),
            refreshAgendaOnly: vi.fn(),
            loading: false,
            error: null,
        };

        (useMeetingState as any).mockReturnValue(mockMeetingState);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should view meeting details successfully (xem chi tiết diễn biến)', () => {
        const { result } = renderHook(() => useDienBienPhienHop(null));

        expect(result.current.meeting?.id).toBe('meeting-123');
        expect(result.current.meetingContents.length).toBe(1);
        expect(result.current.meetingContents[0].title).toBe('Nội dung 1');
        expect(result.current.votingIssues.length).toBe(1);
        expect(result.current.votingIssues[0].issue).toBe('Biểu quyết 1');
    });

    it('should warn when calling checkAttendance if user has not checked in', () => {
        // Change attendance status to PENDING / NOT checked in
        mockMeetingState.attendees.participants[0].attendanceStatus = 'ABSENT';
        (useMeetingState as any).mockReturnValue(mockMeetingState);

        const { result } = renderHook(() => useDienBienPhienHop(null));

        act(() => {
            result.current.handleRequestToSpeak();
        });

        expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('Bạn chưa điểm danh'));
    });

    it('should self check-in successfully for internal delegate', async () => {
        mockMeetingState.attendees.participants[0].attendanceStatus = 'ABSENT';
        (useMeetingState as any).mockReturnValue(mockMeetingState);

        vi.spyOn(meetingApi, 'updateAttendanceStatus').mockResolvedValue({ success: true } as any);

        const { result } = renderHook(() => useDienBienPhienHop(null));

        await act(async () => {
            await result.current.handleSelfCheckIn();
        });

        expect(meetingApi.updateAttendanceStatus).toHaveBeenCalledWith('meeting-123', 'part-1', 'INTERNAL', 'PRESENT');
        expect(toast.success).toHaveBeenCalledWith('Điểm danh thành công!');
        expect(mockMeetingState.refreshAll).toHaveBeenCalled();
    });

    it('should self check-in successfully for guest substitute token', async () => {
        mockMeetingState.attendees.guests = [
            { guestId: 'guest-1', id: 'guest-1', guestToken: 'token-guest', fullName: 'Khách 1', attendanceStatus: 'ABSENT' }
        ];
        (useMeetingState as any).mockReturnValue(mockMeetingState);

        vi.spyOn(meetingApi, 'publicUpdateAttendanceStatus').mockResolvedValue({ success: true } as any);

        const { result } = renderHook(() => useDienBienPhienHop('token-guest'));

        await act(async () => {
            await result.current.handleSelfCheckIn();
        });

        expect(meetingApi.publicUpdateAttendanceStatus).toHaveBeenCalledWith('token-guest', { attendanceStatus: 'PRESENT' });
        expect(toast.success).toHaveBeenCalledWith('Điểm danh thành công!');
        expect(mockMeetingState.refreshAll).toHaveBeenCalled();
    });

    it('should register speech queue request successfully for delegates', async () => {
        vi.spyOn(meetingApi, 'requestToSpeak').mockResolvedValue({ success: true } as any);

        const { result } = renderHook(() => useDienBienPhienHop(null));

        await act(async () => {
            await result.current.handleRequestToSpeak();
        });

        expect(meetingApi.requestToSpeak).toHaveBeenCalledWith('meeting-123', 'agenda-1');
        expect(toast.success).toHaveBeenCalledWith('Đã đăng ký phát biểu thành công');
    });

    it('should allow CHAIR/SECRETARY to start turn of a queued speaker', async () => {
        // Change role to CHAIR
        mockMeetingState.attendees.participants[0].participantRole = 'CHAIR';
        mockMeetingState.speakersQueue = [
            { id: 'speak-queue-1', userId: 'user-2', userName: 'Delegate 2', queueStatus: 'QUEUED' }
        ];
        (useMeetingState as any).mockReturnValue(mockMeetingState);

        vi.spyOn(meetingApi, 'startSpeakerTurn').mockResolvedValue({ success: true, data: { id: 'turn-123' } } as any);

        const { result } = renderHook(() => useDienBienPhienHop(null));

        // Assign/start speech turn
        await act(async () => {
            result.current.handleAssignSpeech('speak-queue-1');
        });

        // Set speaking duration to "10" minutes and confirm
        act(() => {
            result.current.setSpeakingDuration("10");
        });

        await act(async () => {
            await result.current.handleConfirmDuration();
        });

        expect(meetingApi.startSpeakerTurn).toHaveBeenCalledWith('meeting-123', 'speak-queue-1', 10);
        expect(toast.success).toHaveBeenCalledWith('Đã chuyển quyền phát biểu');
    });

    it('should allow CHAIR to stop current speaker turn', async () => {
        mockMeetingState.attendees.participants[0].participantRole = 'CHAIR';
        mockMeetingState.speakersQueue = [
            { id: 'speak-queue-1', userId: 'user-2', userName: 'Delegate 2', queueStatus: 'SPEAKING', activeTurnId: 'turn-123' }
        ];
        (useMeetingState as any).mockReturnValue(mockMeetingState);

        vi.spyOn(meetingApi, 'stopSpeakerTurn').mockResolvedValue({ success: true } as any);

        const { result } = renderHook(() => useDienBienPhienHop(null));

        await act(async () => {
            await result.current.handleEndSpeaking();
        });

        expect(meetingApi.stopSpeakerTurn).toHaveBeenCalledWith('meeting-123', 'turn-123');
        expect(toast.success).toHaveBeenCalledWith('Đã dừng phát biểu');
    });

    it('should allow CHAIR/SECRETARY to start a voting session', async () => {
        mockMeetingState.attendees.participants[0].participantRole = 'CHAIR';
        (useMeetingState as any).mockReturnValue(mockMeetingState);

        vi.spyOn(meetingApi, 'startVote').mockResolvedValue({ success: true } as any);

        const { result } = renderHook(() => useDienBienPhienHop(null));

        // Broadcast/Open the vote
        await act(async () => {
            await result.current.handleToggleBroadcast('motion-1');
        });

        // Simulating the flow of ConfirmBroadcast (checkReadiness=false -> opens duration/time modal)
        act(() => {
            result.current.handleConfirmBroadcast(false);
        });

        // Confirm voting time (duration in minutes)
        await act(async () => {
            await result.current.handleConfirmVotingTime(5);
        });

        expect(meetingApi.startVote).toHaveBeenCalledWith('motion-1', 5);
        expect(toast.success).toHaveBeenCalledWith('Đã kích hoạt phiên biểu quyết thành công');
    });

    it('should cast vote successfully for delegates', async () => {
        mockMeetingState.motions[0].status = 'SUBMITTED'; // Active / Voting status
        (useMeetingState as any).mockReturnValue(mockMeetingState);

        vi.spyOn(meetingApi, 'castVote').mockResolvedValue({ success: true } as any);

        const { result } = renderHook(() => useDienBienPhienHop(null));

        // Wait for auto-open effect to fire and set active voting issue
        expect(result.current.isVotingModalOpen).toBe(true);

        await act(async () => {
            await result.current.handleVote('agree');
        });

        expect(meetingApi.castVote).toHaveBeenCalledWith('motion-1', 'opt-yes');
        expect(toast.success).toHaveBeenCalledWith('Đã thực hiện biểu quyết thành công');
    });

    it('should determine who can vote via auto-opening of the voting modal (isVotingModalOpen)', () => {
        // 1. Secretary case -> should NOT auto-open voting modal
        mockMeetingState.motions[0].status = 'SUBMITTED';
        mockMeetingState.attendees.participants[0].participantRole = 'SECRETARY';
        (useMeetingState as any).mockReturnValue(mockMeetingState);

        const { result: resSec } = renderHook(() => useDienBienPhienHop(null));
        expect(resSec.current.isVotingModalOpen).toBe(false);

        // 2. Substitute case - original delegate NOT absent -> should NOT auto-open
        mockMeetingState.attendees.participants = [
            { id: 'part-sub', userId: 'user-sub', fullName: 'Sub User', isSubstitute: true, substituteForParticipantId: 'part-orig', attendanceStatus: 'PRESENT' },
            { id: 'part-orig', userId: 'user-orig', fullName: 'Orig User', inviteStatus: 'ACCEPTED', attendanceStatus: 'ABSENT' }
        ];
        (useMeetingState as any).mockReturnValue(mockMeetingState);
        (useAuth as any).mockReturnValue({ user: { id: 'user-sub' } });

        const { result: resSubNo } = renderHook(() => useDienBienPhienHop(null));
        expect(resSubNo.current.isVotingModalOpen).toBe(false);

        // 3. Substitute case - original delegate IS absent -> should auto-open
        mockMeetingState.attendees.participants[1].inviteStatus = 'DECLINED';
        mockMeetingState.attendees.participants[1].isFullSession = true;
        (useMeetingState as any).mockReturnValue(mockMeetingState);

        const { result: resSubYes } = renderHook(() => useDienBienPhienHop(null));
        expect(resSubYes.current.isVotingModalOpen).toBe(true);
    });
});
