import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useWebSocket } from '@/app/context/WebSocketContext';
import { meetingApi } from '../services/meeting.api';

export function useMeetingState(meetingId: string | undefined, guestToken?: string | null) {
    const [meeting, setMeeting] = useState<any>(null);
    const [agendaItems, setAgendaItems] = useState<any[]>([]);
    const [opinions, setOpinions] = useState<any[]>([]);
    const [motions, setMotions] = useState<any[]>([]);
    const [speakersQueue, setSpeakersQueue] = useState<any[]>([]);
    const [attendees, setAttendees] = useState<any>({ participants: [], guests: [] });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<any>(null);

    const { subscribe } = useWebSocket();

    const refreshData = useCallback(async () => {
        if (!meetingId) return;
        try {
            setError(null);
            if (guestToken) {
                const [
                    meetingRes,
                    agendaRes,
                    opinionsRes,
                    motionsRes,
                    speakersRes,
                    attendeesRes
                ] = await Promise.all([
                    meetingApi.publicGetMeeting(guestToken),
                    meetingApi.publicGetAgendaItems(guestToken),
                    meetingApi.publicGetOpinions(guestToken),
                    meetingApi.publicGetMotions(guestToken),
                    meetingApi.publicGetSpeakersQueue(guestToken),
                    meetingApi.publicGetAttendees(guestToken)
                ]);

                if (meetingRes.success && meetingRes.data) {
                    setMeeting(meetingRes.data);
                }
                if (agendaRes.success && agendaRes.data) {
                    setAgendaItems(agendaRes.data);
                }
                if (opinionsRes.success && opinionsRes.data) {
                    setOpinions(opinionsRes.data);
                }
                if (motionsRes.success && motionsRes.data) {
                    setMotions(motionsRes.data);
                }
                if (speakersRes.success && speakersRes.data) {
                    setSpeakersQueue(speakersRes.data);
                }
                if (attendeesRes.success && attendeesRes.data) {
                    setAttendees(attendeesRes.data);
                }
            } else {
                const [
                    meetingRes,
                    agendaRes,
                    opinionsRes,
                    motionsRes,
                    speakersRes,
                    attendeesRes
                ] = await Promise.all([
                    meetingApi.getMeetingById(meetingId),
                    meetingApi.getAgendaItems(meetingId),
                    meetingApi.getOpinions(meetingId),
                    meetingApi.getMeetingMotions(meetingId),
                    meetingApi.getSpeakersQueue(meetingId),
                    meetingApi.getAttendees(meetingId)
                ]);

                if (meetingRes.success && meetingRes.data) {
                    setMeeting(meetingRes.data);
                }
                if (agendaRes.success && agendaRes.data) {
                    setAgendaItems(agendaRes.data);
                }
                if (opinionsRes.success && opinionsRes.data) {
                    setOpinions(opinionsRes.data);
                }
                if (motionsRes.success && motionsRes.data) {
                    setMotions(motionsRes.data);
                }
                if (speakersRes.success && speakersRes.data) {
                    setSpeakersQueue(speakersRes.data);
                }
                if (attendeesRes.success && attendeesRes.data) {
                    setAttendees(attendeesRes.data);
                }
            }
        } catch (err: any) {
            console.error("Failed to load meeting data", err);
            setError(err);
        }
    }, [meetingId, guestToken]);

    const refreshMeetingOnly = useCallback(async () => {
        if (!meetingId) return;
        try {
            if (guestToken) {
                const res = await meetingApi.publicGetMeeting(guestToken);
                if (res.success && res.data) {
                    setMeeting(res.data);
                }
            } else {
                const res = await meetingApi.getMeetingById(meetingId);
                if (res.success && res.data) {
                    setMeeting(res.data);
                }
            }
        } catch (error: any) {
            console.error("Failed to refresh meeting detail", error);
            setError(error);
        }
    }, [meetingId, guestToken]);

    const refreshAgendaOnly = useCallback(async () => {
        if (!meetingId) return;
        try {
            if (guestToken) {
                const res = await meetingApi.publicGetAgendaItems(guestToken);
                if (res.success && res.data) {
                    setAgendaItems(res.data);
                }
            } else {
                const agendaRes = await meetingApi.getAgendaItems(meetingId);
                if (agendaRes.success && agendaRes.data) {
                    setAgendaItems(agendaRes.data);
                }
            }
        } catch (error) {
            console.error("Failed to refresh agenda list", error);
        }
    }, [meetingId, guestToken]);

    const refreshSpeakersOnly = useCallback(async () => {
        if (!meetingId) return;
        try {
            if (guestToken) {
                const res = await meetingApi.publicGetSpeakersQueue(guestToken);
                if (res.success && res.data) {
                    setSpeakersQueue(res.data);
                }
            } else {
                const speakersRes = await meetingApi.getSpeakersQueue(meetingId);
                if (speakersRes.success && speakersRes.data) {
                    setSpeakersQueue(speakersRes.data);
                }
            }
        } catch (error) {
            console.error("Failed to refresh speakers queue", error);
        }
    }, [meetingId, guestToken]);

    const refreshMotionsOnly = useCallback(async () => {
        if (!meetingId) return;
        try {
            if (guestToken) {
                const res = await meetingApi.publicGetMotions(guestToken);
                if (res.success && res.data) {
                    setMotions(res.data);
                }
            } else {
                const motionsRes = await meetingApi.getMeetingMotions(meetingId);
                if (motionsRes.success && motionsRes.data) {
                    setMotions(motionsRes.data);
                }
            }
        } catch (error) {
            console.error("Failed to refresh motions list", error);
        }
    }, [meetingId, guestToken]);

    // Fetch initial data
    useEffect(() => {
        if (!meetingId) return;
        setLoading(true);
        refreshData().finally(() => setLoading(false));
    }, [meetingId, refreshData]);

    // WebSocket real-time subscription
    useEffect(() => {
        if (!meetingId) return;

        let meetingTimeout: any = null;
        let speakersTimeout: any = null;
        let motionsTimeout: any = null;

        // Subscribing to meeting events
        const unsubMeeting = subscribe(`/topic/meeting/${meetingId}`, (msg: any) => {
            if (msg && msg.action) {
                if (msg.action === "START_AGENDA") {
                    toast.info(`Bắt đầu nội dung: ${msg.title || ""}`);
                    if (meetingTimeout) clearTimeout(meetingTimeout);
                    meetingTimeout = setTimeout(() => refreshAgendaOnly(), 300);
                } else if (msg.action === "COMPLETE_AGENDA") {
                    toast.success(`Hoàn tất nội dung: ${msg.title || ""}`);
                    if (meetingTimeout) clearTimeout(meetingTimeout);
                    meetingTimeout = setTimeout(() => refreshAgendaOnly(), 300);
                } else if (msg.action === "SKIP_AGENDA") {
                    toast.info(`Đã bỏ qua nội dung: ${msg.title || ""}`);
                    if (meetingTimeout) clearTimeout(meetingTimeout);
                    meetingTimeout = setTimeout(() => refreshAgendaOnly(), 300);
                } else if (msg.action === "REFRESH_MEETING_STATUS") {
                    if (meetingTimeout) clearTimeout(meetingTimeout);
                    meetingTimeout = setTimeout(() => refreshMeetingOnly(), 300);
                } else if (msg.action === "REFRESH_AGENDA") {
                    if (meetingTimeout) clearTimeout(meetingTimeout);
                    meetingTimeout = setTimeout(() => refreshAgendaOnly(), 300);
                } else if (msg.action === "REFRESH_MEETING_DETAIL") {
                    toast.info("Phiên họp đã được cập nhật");
                    if (meetingTimeout) clearTimeout(meetingTimeout);
                    meetingTimeout = setTimeout(() => refreshData(), 300);
                } else {
                    if (meetingTimeout) clearTimeout(meetingTimeout);
                    meetingTimeout = setTimeout(() => refreshData(), 300);
                }
            } else {
                if (meetingTimeout) clearTimeout(meetingTimeout);
                meetingTimeout = setTimeout(() => refreshData(), 300);
            }
        });

        // Subscribing to speaker queue changes
        const unsubSpeakers = subscribe(`/topic/meeting/${meetingId}/speakers`, () => {
            if (speakersTimeout) clearTimeout(speakersTimeout);
            speakersTimeout = setTimeout(() => refreshSpeakersOnly(), 300);
        });

        // Subscribing to motions (voting) changes
        const unsubMotions = subscribe(`/topic/meeting/${meetingId}/motions`, (msg: any) => {
            if (msg && msg.action) {
                if (msg.action === "START_VOTE") {
                    toast.info(`Chủ trì bắt đầu biểu quyết: ${msg.motionTitle || ""}`);
                } else if (msg.action === "STOP_VOTE") {
                    toast.success(`Đã kết thúc biểu quyết: ${msg.motionTitle || ""}`);
                }
            }
            if (motionsTimeout) clearTimeout(motionsTimeout);
            motionsTimeout = setTimeout(() => refreshMotionsOnly(), 300);
        });

        return () => {
            unsubMeeting();
            unsubSpeakers();
            unsubMotions();
            if (meetingTimeout) clearTimeout(meetingTimeout);
            if (speakersTimeout) clearTimeout(speakersTimeout);
            if (motionsTimeout) clearTimeout(motionsTimeout);
        };
    }, [meetingId, subscribe, refreshData, refreshMeetingOnly, refreshAgendaOnly, refreshSpeakersOnly, refreshMotionsOnly]);

    return {
        meeting,
        agendaItems,
        opinions,
        motions,
        speakersQueue,
        attendees,
        loading,
        error,
        refreshAll: refreshData,
        refreshMeetingOnly,
        refreshAgendaOnly,
        refreshSpeakersOnly
    };
}
