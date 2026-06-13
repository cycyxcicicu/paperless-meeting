import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { toast } from '@/lib/toast';
import { getErrorMessage } from "@/lib/api/error";
import { Sidebar } from '@/common/components/layout/Sidebar';
import {
    ChiTietHopData,
    ChiTietHopStep,
} from '@/modules/meeting/components/ChiTietHopStep';
import {
    NoiDungHopData,
    NoiDungHopStep,
} from '@/modules/meeting/components/NoiDungHopStep';
import {
    ThanhPhanThamDuData,
    ThanhPhanThamDuStep,
} from '@/modules/meeting/components/ThanhPhanThamDuStep';
import { ThongBaoGiayMoiStep, ThongBaoGiayMoiData } from '@/modules/meeting/components/ThongBaoGiayMoiStep';
import { WizardFooter } from '@/modules/meeting/components/WizardFooter';
import { WizardStepper } from '@/modules/meeting/components/WizardStepper';
import { chiTietHopSchema, noiDungHopSchema, thongBaoGiayMoiSchema } from '../form/meeting.validation';
import { meetingApi } from "@/modules/meeting/services/meeting.api";
import { useAuth } from "@/app/context/AuthContext";
import { useWebSocket } from "@/app/context/WebSocketContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { AlertCircle } from "lucide-react";

import { PHIEN_HOP_SIDEBAR_ITEMS } from '@/app/constants/sidebar';
const STEPS = [
    {
        id: 1,
        title: "Chi tiết họp",
        description: "Thông tin cơ bản",
    },
    {
        id: 2,
        title: "Thành phần tham dự",
        description: "Đơn vị và khách mời",
    },
    {
        id: 3,
        title: "Thông báo và giấy mời",
        description: "Biểu mẫu thư mời",
    },
    {
        id: 4,
        title: "Nội dung họp",
        description: "Chi tiết và tài liệu",
    },
];

type ApprovalStatus = "draft" | "pending" | "approved" | "sent";

const toLocalISOString = (dateOrStr: string | Date | undefined): string => {
    if (!dateOrStr) return "";
    const date = new Date(dateOrStr);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const TaoPhienHopPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isUpdateMode = !!id; // Nếu có id thì là mode update
    const copyFromId = location.state?.copyFromId;
    const isCopyMode = !!copyFromId;

    const { user } = useAuth();
    const { subscribe } = useWebSocket();
    const departmentId = typeof user?.department === 'object' && user?.department !== null ? (user.department as any).id : null;

    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [approvalStatus, setApprovalStatus] =
        useState<ApprovalStatus>("draft");
    const [rejectReason, setRejectReason] = useState("");
    const [meetingStatus, setMeetingStatus] = useState<string | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectInput, setRejectInput] = useState("");
    const [isLoadingData, setIsLoadingData] = useState(isUpdateMode || isCopyMode);
    const [highestStepReached, setHighestStepReached] = useState(1);
    const [activeMeetingId, setActiveMeetingId] = useState<string | null>(id || null);
    const [isSavingStep, setIsSavingStep] = useState(false);
    const [apiCanApprove, setApiCanApprove] = useState(false);

    // Quyền phê duyệt từ Backend + cuộc họp đang chờ duyệt
    const canApprove = apiCanApprove && approvalStatus === 'pending';

    const isReadOnly = approvalStatus === "pending" || approvalStatus === "approved";
    const [isDirty, setIsDirty] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    useEffect(() => {
        if (currentStep > highestStepReached) {
            setHighestStepReached(currentStep);
        }
    }, [currentStep, highestStepReached]);
    // Step 1 data
    const [chiTietData, setChiTietData] = useState<ChiTietHopData>({
        tenPhienHop: "",
        thoiGianBatDau: "",
        thoiGianKetThuc: "",
        diaDiem: "",
        linkHopTrucTuyen: "",
        soPhutDenMuon: 0,
        noiDungChuongTrinh: "text",
        noiDungChuongTrinhText: "",
    });

    const [chiTietErrors, setChiTietErrors] = useState<Record<string, string>>(
        {},
    );

    // Step 2 data
    const [thanhPhanData, setThanhPhanData] = useState<ThanhPhanThamDuData>({
        donVi: [],
        caNhan: [],
        nhomThanhVien: [],
        khachMoi: [],
        chuTriId: null,
    });

    // Step 3 data
    const [thongBaoData, setThongBaoData] = useState<ThongBaoGiayMoiData>({
        mauGiayMoi: 'mau-1',
        tieuDe: 'GIẤY MỜI HỌP',
        noiDung: 'Trân trọng kính mời đồng chí tới tham dự cuộc họp...',
        trangThaiKy: 'co-ky',
    });
    const [thongBaoErrors, setThongBaoErrors] = useState<Record<string, string>>({});

    // Step 4 data
    const [noiDungData, setNoiDungData] = useState<NoiDungHopData>({
        contents: [
            {
                id: "content-1",
                noiDungChiTiet: "",
                thoiGianBatDau: "",
                thoiGianKetThuc: "",
                nguoiChuanBi: "",
                nguoiDuyet: "",
                taiLieu: [],
                bieuQuyetIssues: [],
                thanhPhanThamDu: {
                    donVi: [],
                    khachMoi: [],
                },
            },
        ],
    });

    const [noiDungErrors, setNoiDungErrors] = useState<Record<string, any>>({});

    useEffect(() => {
        if (!isLoadingData && (activeMeetingId || isCopyMode || (!isUpdateMode && !isCopyMode))) {
            const timer = setTimeout(() => {
                setInitialLoadDone(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isLoadingData, activeMeetingId]);

    useEffect(() => {
        if (initialLoadDone && !isReadOnly) {
            setIsDirty(true);
        }
    }, [chiTietData, thanhPhanData, thongBaoData, noiDungData, initialLoadDone, isReadOnly]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty && !isReadOnly) {
                e.preventDefault();
                e.returnValue = "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?";
                return e.returnValue;
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty, isReadOnly]);

    useEffect(() => {
        if (!activeMeetingId) return;

        const unsubscribe = subscribe(`/topic/meeting/${activeMeetingId}`, (message: any) => {
            if (message.action === "REFRESH_MEETING_DETAIL") {
                if (message.status) {
                    setMeetingStatus(message.status);
                    if (message.status === 'PENDING_APPROVAL') {
                        setApprovalStatus('pending');
                    } else if (['APPROVED', 'UPCOMING', 'IN_PROGRESS', 'CLOSED'].includes(message.status)) {
                        setApprovalStatus('approved');
                    } else {
                        setApprovalStatus('draft');
                    }
                }
                if (message.rejectReason !== undefined) {
                    setRejectReason(message.rejectReason || "");
                }
                
                // Reload entire detail data to ensure consistency silently
                loadMeetingData(activeMeetingId, false, true);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [subscribe, activeMeetingId]);

    // Map meeting detail to form state from Real APIs
    const loadMeetingData = async (meetingId: string, isCopy = false, silent = false) => {
        if (!silent) {
            setIsLoadingData(true);
        }

        try {
            const [meetingRes, attendeesRes, agendaRes] = await Promise.all([
                meetingApi.getMeetingById(meetingId),
                meetingApi.getAttendees(meetingId),
                meetingApi.getAgendaItems(meetingId)
            ]);

            if (!meetingRes.success || !meetingRes.data) {
                throw new Error("Failed to load meeting details");
            }

            const meeting = meetingRes.data;
            const attendees = attendeesRes.success && attendeesRes.data ? attendeesRes.data : { participants: [], guests: [] };
            const agendaItems = agendaRes.success && agendaRes.data ? agendaRes.data : [];

            let parsedFile = null;
            let noiDungChuongTrinh: 'text' | 'upload' = 'text';
            let noiDungChuongTrinhText = "";

            if (meeting.agendaFile && (meeting.agendaFile.url || meeting.agendaFile.name || meeting.agendaFile.id)) {
                parsedFile = meeting.agendaFile;
                noiDungChuongTrinh = 'upload';
            } else if (meeting.content) {
                noiDungChuongTrinhText = meeting.content;
                noiDungChuongTrinh = 'text';
            }

            // Map to Step 1 data
            const step1Data: ChiTietHopData = {
                tenPhienHop: isCopy ? `${meeting.title} - Bản sao` : meeting.title,
                thoiGianBatDau: meeting.startTime ? meeting.startTime.substring(0, 16) : "",
                thoiGianKetThuc: meeting.endTime ? meeting.endTime.substring(0, 16) : "",
                diaDiem: meeting.locationId || "",
                linkHopTrucTuyen: meeting.onlineLink || "",
                soPhutDenMuon: meeting.lateAfterMinutes ?? 0,
                noiDungChuongTrinh: noiDungChuongTrinh,
                noiDungChuongTrinhText: noiDungChuongTrinhText,
                noiDungChuongTrinhFile: parsedFile,
            };
            setChiTietData(step1Data);

            // Map to Step 2 data
            const chairParticipant = attendees.participants.find((p: any) => p.participantRole === "CHAIR");
            const step2Data: ThanhPhanThamDuData = {
                donVi: attendees.participants.map((p: any) => ({
                    id: p.userId,
                    name: p.fullName || p.username,
                    position: p.positionName || "",
                    unit: p.deptName || "",
                    unitId: "",
                    email: "",
                    isChair: p.participantRole === "CHAIR",
                    isSecretary: p.participantRole === "SECRETARY",
                })),
                caNhan: [],
                nhomThanhVien: [],
                khachMoi: attendees.guests.map((g: any) => ({
                    id: g.id || String(Math.random()),
                    name: g.fullName,
                    email: g.email,
                    phone: g.phone || "",
                    donVi: g.company || "",
                    chucVu: g.position || "",
                    ghiChu: g.note || "",
                })),
                chuTriId: chairParticipant ? chairParticipant.userId : null,
            };
            setThanhPhanData(step2Data);

            // Map approvalStatus
            if (!isCopy) {
                setApiCanApprove(!!meeting.canApprove);
                setMeetingStatus(meeting.status);
                if (meeting.status === 'PENDING_APPROVAL') {
                    setApprovalStatus('pending');
                } else if (['APPROVED', 'UPCOMING', 'IN_PROGRESS', 'CLOSED'].includes(meeting.status)) {
                    setApprovalStatus('approved');
                } else {
                    setApprovalStatus('draft');
                }
                setRejectReason(meeting.rejectReason || "");
            } else {
                setApiCanApprove(false);
                setMeetingStatus(null);
                setApprovalStatus('draft');
                setRejectReason("");
            }

            // Map to Step 3 data (Thong bao)
            const step3Data: ThongBaoGiayMoiData = {
                mauGiayMoi: 'mau-1',
                tieuDe: meeting.title,
                noiDung: 'Trân trọng kính mời đồng chí tới tham dự cuộc họp...',
                trangThaiKy: 'co-ky',
            };
            setThongBaoData(step3Data);

            // Map to Step 4 data
            if (isCopy) {
                const step4Data: NoiDungHopData = {
                    contents: [
                        {
                            id: "content-1",
                            noiDungChiTiet: "",
                            thoiGianBatDau: "",
                            thoiGianKetThuc: "",
                            nguoiChuanBi: "",
                            nguoiDuyet: "",
                            taiLieu: [],
                            bieuQuyetIssues: [],
                            thanhPhanThamDu: {
                                donVi: [],
                                khachMoi: [],
                            },
                            feedbacks: [],
                        },
                    ],
                };
                setNoiDungData(step4Data);
            } else {
                setNoiDungData(prev => {
                    const serverContents = agendaItems.length > 0 ? agendaItems.map((c: any) => ({
                        id: c.id,
                        noiDungChiTiet: c.title || "",
                        content: c.content || "",
                        thoiGianBatDau: c.startTime ? c.startTime.substring(0, 16) : "",
                        thoiGianKetThuc: c.endTime ? c.endTime.substring(0, 16) : "",
                        nguoiChuanBi: c.preparedByUserId || "",
                        nguoiDuyet: "",
                        taiLieu: c.documents ? c.documents.map((d: any) => ({
                            id: d.documentId,
                            name: d.title || d.fileName || "Tài liệu",
                            size: d.fileSize || 0,
                            url: d.fileUrl || "#"
                        })) : [],
                        bieuQuyetIssues: c.motions ? c.motions.map((m: any) => ({
                            id: m.id,
                            ten: m.title,
                            moTa: m.description || ""
                        })) : [],
                        thanhPhanThamDu: {
                            donVi: [],
                            khachMoi: [],
                        },
                        feedbacks: c.feedbacks || [],
                        prepInstructions: c.prepInstructions || "",
                        prepDeadline: c.prepDeadline || "",
                        status: c.status || "DRAFT"
                    })) : [
                        {
                            id: "content-1",
                            noiDungChiTiet: "",
                            thoiGianBatDau: "",
                            thoiGianKetThuc: "",
                            nguoiChuanBi: "",
                            nguoiDuyet: "",
                            taiLieu: [],
                            bieuQuyetIssues: [],
                            thanhPhanThamDu: {
                                donVi: [],
                                khachMoi: [],
                            },
                            feedbacks: [],
                            prepInstructions: "",
                            prepDeadline: "",
                            status: "DRAFT"
                        }
                    ];

                    if (silent && prev?.contents) {
                        const mergedContents = prev.contents.map(localItem => {
                            const serverItem = serverContents.find(s => s.id === localItem.id);
                            if (serverItem) {
                                return {
                                    ...localItem,
                                    status: serverItem.status,
                                    feedbacks: serverItem.feedbacks,
                                    taiLieu: serverItem.taiLieu
                                };
                            }
                            return localItem;
                        });

                        const newServerItems = serverContents.filter(s => 
                            !prev.contents.some(localItem => localItem.id === s.id)
                        );

                        return {
                            contents: [...mergedContents, ...newServerItems]
                        };
                    }

                    return { contents: serverContents };
                });
            }

            // Mark all steps as completed in update mode or copy mode
            setCompletedSteps([1, 2, 3]);
            if (!isCopy) setCompletedSteps([1, 2, 3, 4]);

            // Cho phép click qua lại tất cả các bước đã có dữ liệu
            setHighestStepReached(4);
        } catch (error) {
            console.error("❌ Error loading meeting data:", error);
            toast.error(
                "Không thể tải dữ liệu",
                "Đã xảy ra lỗi khi tải dữ liệu phiên họp. Vui lòng thử lại.",
            );
        } finally {
            if (!silent) {
                setIsLoadingData(false);
            }
        }
    };

    useEffect(() => {
        if (id) {
            loadMeetingData(id, false);
        } else if (copyFromId) {
            loadMeetingData(copyFromId, true);
        }
    }, [id, copyFromId]);

    // Validation
    const validateStep1 = (): boolean => {
        const result = chiTietHopSchema.safeParse(chiTietData);
        if (!result.success) {
            const formattedErrors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as string;
                if (!formattedErrors[path]) {
                    formattedErrors[path] = issue.message;
                }
            });
            setChiTietErrors(formattedErrors);
            return false;
        }
        setChiTietErrors({});
        return true;
    };

    const validateStep3 = (): boolean => {
        const result = thongBaoGiayMoiSchema.safeParse(thongBaoData);
        if (!result.success) {
            const formattedErrors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as string;
                if (!formattedErrors[path]) {
                    formattedErrors[path] = issue.message;
                }
            });
            setThongBaoErrors(formattedErrors);
            return false;
        }
        setThongBaoErrors({});
        return true;
    };

    const validateStep4 = (): boolean => {
        const errors: Record<string, any> = {};

        // Gọi Zod Schema để validate (sẽ check require, và logic kết thúc sau bắt đầu)
        const result = noiDungHopSchema.safeParse(noiDungData);
        
        if (!result.success) {
            result.error.issues.forEach(issue => {
                const index = issue.path[1] as number; // contents[1]
                const field = issue.path[2] as string; // thoiGianBatDau
                const contentId = noiDungData.contents[index].id;
                
                if (!errors[contentId]) errors[contentId] = {};
                errors[contentId][field] = issue.message;
            });
        }

        // Validate logic nghiệp vụ chuyên sâu (liên kết với Step 1 và tính tuần tự)
        const phienHopStart = chiTietData.thoiGianBatDau ? new Date(chiTietData.thoiGianBatDau).getTime() : 0;
        const phienHopEnd = chiTietData.thoiGianKetThuc ? new Date(chiTietData.thoiGianKetThuc).getTime() : Infinity;

        let previousContentEnd: number | null = null;

        noiDungData.contents.forEach((content, index) => {
            if (!errors[content.id]) errors[content.id] = {};
            
            // Validate: if nguoiChuanBi is selected, prepInstructions cannot be empty
            const isDraft = !content.status || content.status === 'DRAFT';
            if (isDraft && content.nguoiChuanBi && (!content.prepInstructions || !content.prepInstructions.trim())) {
                errors[content.id].prepInstructions = "Vui lòng nhập hướng dẫn chuẩn bị tài liệu khi chọn người chuẩn bị";
            }

            let currentStart: number | null = null;
            let currentEnd: number | null = null;

            if (content.thoiGianBatDau) {
                currentStart = new Date(content.thoiGianBatDau).getTime();
                if (phienHopStart && currentStart < phienHopStart) {
                    errors[content.id].thoiGianBatDau = "Bắt đầu không được trước thời gian phiên họp";
                }
                if (phienHopEnd && currentStart > phienHopEnd) {
                    errors[content.id].thoiGianBatDau = "Bắt đầu không được sau thời gian phiên họp";
                }
                if (previousContentEnd && currentStart < previousContentEnd) {
                    errors[content.id].thoiGianBatDau = `Phải bắt đầu sau khi Nội dung trước kết thúc`;
                }
            }
            
            if (content.thoiGianKetThuc) {
                currentEnd = new Date(content.thoiGianKetThuc).getTime();
                if (phienHopStart && currentEnd < phienHopStart) {
                    errors[content.id].thoiGianKetThuc = "Kết thúc không được trước thời gian phiên họp";
                }
                if (phienHopEnd && currentEnd > phienHopEnd) {
                    errors[content.id].thoiGianKetThuc = "Kết thúc không được vượt quá thời gian phiên họp";
                }
                
                // Track this end time for the next content block only if there are no errors in this block's time
                if (!errors[content.id].thoiGianKetThuc && !errors[content.id].thoiGianBatDau) {
                    previousContentEnd = currentEnd;
                }
            }

            if (Object.keys(errors[content.id]).length === 0) {
                delete errors[content.id];
            }
        });

        setNoiDungErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Step click handler
    const handleStepClick = (stepId: number) => {
        if (isReadOnly || stepId <= highestStepReached) {
            setCurrentStep(stepId);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };



    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Navigation handlers with Auto-Save
    const handleNext = async () => {
        if (isReadOnly) {
            if (currentStep < STEPS.length) {
                setCurrentStep(currentStep + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
            return;
        }

        if (currentStep === 1) {
            if (!validateStep1()) {
                return;
            }

            setIsSavingStep(true);
            try {
                const payload = {
                    title: chiTietData.tenPhienHop,
                    startTime: toLocalISOString(chiTietData.thoiGianBatDau),
                    endTime: toLocalISOString(chiTietData.thoiGianKetThuc),
                    locationId: chiTietData.diaDiem,
                    departmentId: departmentId || undefined,
                    content: chiTietData.noiDungChuongTrinh === 'text' ? (chiTietData.noiDungChuongTrinhText || "") : null,
                    agendaFile: chiTietData.noiDungChuongTrinh === 'upload' ? chiTietData.noiDungChuongTrinhFile : null,
                    onlineLink: chiTietData.linkHopTrucTuyen || undefined,
                    rsvpDeadline: undefined,
                    lateAfterMinutes: Number(chiTietData.soPhutDenMuon) || 0,
                };

                let savedMeeting: any;
                if (activeMeetingId) {
                    const res = await meetingApi.updateMeeting(activeMeetingId, payload);
                    if (!res.success) throw new Error(res.message || "Cập nhật thất bại");
                    savedMeeting = res.data;
                    toast.success("Tự động lưu bước 1 thành công");
                } else {
                    const res = await meetingApi.createMeeting(payload);
                    if (!res.success) throw new Error(res.message || "Tạo mới thất bại");
                    savedMeeting = res.data;
                    setActiveMeetingId(savedMeeting.id);
                    window.history.replaceState(null, "", `/phien-hop/${savedMeeting.id}/chinh-sua`);
                    toast.success("Đã khởi tạo phiên họp nháp");
                }

                if (!completedSteps.includes(1)) {
                    setCompletedSteps([...completedSteps, 1]);
                }
                setIsDirty(false);
            } catch (err: any) {
                console.error("Error saving step 1:", err);
                toast.error("Lưu thông tin thất bại", getErrorMessage(err, "Vui lòng kiểm tra lại kết nối."));
                return;
            } finally {
                setIsSavingStep(false);
            }
        }

        if (currentStep === 2) {
            if (!activeMeetingId) {
                toast.error("Thiếu ID cuộc họp");
                return;
            }

            const hasChair = thanhPhanData.donVi.some(u => u.isChair);
            if (!hasChair) {
                toast.error("Vui lòng chọn ít nhất một người chủ trì cuộc họp");
                return;
            }

            setIsSavingStep(true);
            try {
                const payload = {
                    participants: thanhPhanData.donVi.map(u => ({
                        userId: u.id,
                        participantRole: u.isChair ? 'CHAIR' : (u.isSecretary ? 'SECRETARY' : 'PARTICIPANT')
                    })),
                    guests: thanhPhanData.khachMoi.map(g => ({
                        fullName: g.name,
                        email: g.email,
                        phone: g.phone || '',
                        company: g.donVi || '',
                        position: g.chucVu || '',
                        note: g.ghiChu || ''
                    }))
                };

                const res = await meetingApi.submitAttendees(activeMeetingId, payload);
                if (!res.success) throw new Error(res.message || "Lưu thành viên thất bại");

                toast.success("Đã cập nhật danh sách thành viên");
                if (!completedSteps.includes(2)) {
                    setCompletedSteps([...completedSteps, 2]);
                }
                setIsDirty(false);
            } catch (err: any) {
                console.error("Error saving step 2:", err);
                toast.error("Lưu thành viên thất bại", getErrorMessage(err));
                return;
            } finally {
                setIsSavingStep(false);
            }
        }

        if (currentStep === 3) {
            if (!validateStep3()) {
                return;
            }
            toast.success("Đã lưu mẫu giấy mời");
            if (!completedSteps.includes(3)) {
                setCompletedSteps([...completedSteps, 3]);
            }
            setIsDirty(false);
        }

        if (currentStep === 4) {
            if (!validateStep4()) {
                return;
            }
            if (!completedSteps.includes(4)) {
                setCompletedSteps([...completedSteps, 4]);
            }
            setIsDirty(false);
        }

        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Helper Pipeline to save step 4 Agenda & Upload/Attach Files
    const saveAgendaItemsPipeline = async () => {
        if (!activeMeetingId) throw new Error("Thiếu ID cuộc họp");

        const batchItems = noiDungData.contents.map((c, index) => {
            const duration = Math.max(1, Math.round((new Date(c.thoiGianKetThuc).getTime() - new Date(c.thoiGianBatDau).getTime()) / 60000));
            return {
                id: c.id.startsWith("content-") ? undefined : c.id,
                title: c.noiDungChiTiet,
                content: c.content || undefined,
                durationEst: duration,
                preparedByUserId: c.nguoiChuanBi || undefined,
                startTime: toLocalISOString(c.thoiGianBatDau),
                endTime: toLocalISOString(c.thoiGianKetThuc),
                orderNo: index + 1,
                documentIds: c.taiLieu?.map((d: any) => d.id) || [],
                motions: c.bieuQuyetIssues?.map((b: any) => ({
                    id: b.id.startsWith("issue-") ? undefined : b.id,
                    title: b.ten,
                    description: b.moTa || ""
                })) || [],
                prepInstructions: c.prepInstructions || undefined
            };
        });

        const res = await meetingApi.createAgendaItem(activeMeetingId, batchItems);
        if (!res.success) {
            throw new Error(res.message || "Lưu danh sách nội dung họp thất bại");
        }

        if (res.data) {
            const savedItems = res.data;
            const updatedContents = noiDungData.contents.map((original, index) => {
                const c = savedItems[index];
                if (!c) return original;
                return {
                    ...original,
                    id: c.id,
                    feedbacks: c.feedbacks || [],
                    taiLieu: c.documents ? c.documents.map((d: any) => ({
                        id: d.documentId,
                        name: d.title || d.fileName || "Tài liệu",
                        size: d.fileSize || 0,
                        url: d.fileUrl || "#"
                    })) : [],
                    bieuQuyetIssues: c.motions ? c.motions.map((m: any) => ({
                        id: m.id,
                        ten: m.title,
                        moTa: m.description || ""
                    })) : [],
                    prepInstructions: c.prepInstructions || ""
                };
            });

            setNoiDungData({
                ...noiDungData,
                contents: updatedContents
            });
        }
    };

    const handleSaveDraftAgenda = async () => {
        if (!validateStep4()) {
            return;
        }

        setIsSavingStep(true);
        try {
            await saveAgendaItemsPipeline();
            toast.success("Lưu nội dung họp thành công");
            setIsDirty(false);
        } catch (err: any) {
            console.error("Failed to save draft agenda:", err);
            toast.error("Lưu thất bại", getErrorMessage(err));
        } finally {
            setIsSavingStep(false);
        }
    };

    const handleSubmitForApproval = async () => {
        if (!validateStep4()) {
            return;
        }

        setIsSavingStep(true);
        try {
            await saveAgendaItemsPipeline();
            const res = await meetingApi.submitApproval(activeMeetingId!);
            if (!res.success) throw new Error(res.message || "Gửi phê duyệt thất bại");

            toast.success(
                "Gửi phê duyệt thành công",
                "Phiên họp đã được gửi đi. Vui lòng chờ phê duyệt để tiếp tục.",
            );
            setIsDirty(false);
            navigate("/phien-hop");
        } catch (err: any) {
            console.error("Failed to submit for approval:", err);
            toast.error("Gửi phê duyệt thất bại", getErrorMessage(err));
        } finally {
            setIsSavingStep(false);
        }
    };

    const handleSubmitMeeting = async () => {
        if (!validateStep4()) {
            return;
        }

        if (approvalStatus !== 'approved') {
            toast.error("Thao tác thất bại", "Cuộc họp chưa được phê duyệt. Vui lòng gửi yêu cầu phê duyệt và chờ cấp có thẩm quyền phê duyệt trước khi công bố.");
            return;
        }

        setIsSavingStep(true);
        try {
            await saveAgendaItemsPipeline();

            const res = await meetingApi.publishMeeting(activeMeetingId!);
            if (!res.success) throw new Error(res.message || "Công bố thất bại");

            toast.success(
                "Công bố phiên họp thành công",
                `Đã công bố phiên họp "${chiTietData.tenPhienHop}" thành công`,
            );
            setIsDirty(false);
            navigate("/phien-hop");
        } catch (err: any) {
            console.error("Failed to complete meeting creation:", err);
            toast.error("Thao tác thất bại", getErrorMessage(err));
        } finally {
            setIsSavingStep(false);
        }
    };

    const handleCancelWithConfirm = () => {
        setIsDirty(false);
        navigate("/phien-hop");
    };

    const handleApprove = async () => {
        if (!activeMeetingId) return;
        setIsSavingStep(true);
        try {
            const res = await meetingApi.approveMeeting(activeMeetingId);
            if (!res.success) throw new Error(res.message || "Phê duyệt cuộc họp thất bại");
            toast.success("Phê duyệt cuộc họp thành công");
            setIsDirty(false);
            navigate("/phien-hop");
        } catch (err: any) {
            console.error("Failed to approve meeting:", err);
            toast.error("Phê duyệt thất bại", getErrorMessage(err));
        } finally {
            setIsSavingStep(false);
        }
    };

    const handleRejectClick = () => {
        setRejectInput("");
        setIsRejectModalOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!activeMeetingId) return;
        if (!rejectInput.trim()) {
            toast.error("Lỗi", "Vui lòng nhập lý do từ chối");
            return;
        }

        setIsSavingStep(true);
        setIsRejectModalOpen(false);
        try {
            const res = await meetingApi.rejectMeeting(activeMeetingId, rejectInput.trim());
            if (!res.success) throw new Error(res.message || "Từ chối cuộc họp thất bại");
            toast.success("Đã từ chối phê duyệt cuộc họp");
            setIsDirty(false);
            navigate("/phien-hop");
        } catch (err: any) {
            console.error("Failed to reject meeting:", err);
            toast.error("Từ chối thất bại", getErrorMessage(err));
        } finally {
            setIsSavingStep(false);
        }
    };

    return (
        <>
            <div className="py-6">

                {/* Header */}
                <div className="px-8 mb-6">
                    <button
                        onClick={handleCancelWithConfirm}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-3"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm body">
                            Quay lại
                        </span>
                    </button>
                    <h1 className="text-2xl heading text-gray-900">
                        {isUpdateMode
                            ? "Cập nhật phiên họp"
                            : "Tạo phiên họp mới"}
                    </h1>
                </div>

                {/* SINGLE CARD WRAPPER */}
                <div className="px-8">
                    <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Step Wizard - Inside Card */}
                        <div className="px-8 pt-6 pb-5">
                            <WizardStepper
                                steps={STEPS}
                                currentStep={currentStep}
                                onStepClick={handleStepClick}
                                completedSteps={completedSteps}
                                highestStepReached={highestStepReached}
                            />
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-200" />

                        {/* Form Content - Inside Card */}
                        <div className="px-8 py-6 relative">
                            {rejectReason && meetingStatus === 'REJECTED' && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-red-800">Phiên họp bị từ chối duyệt</h4>
                                        <p className="text-sm text-red-700 mt-1"><span className="font-medium">Lý do:</span> {rejectReason}</p>
                                    </div>
                                </div>
                            )}

                            {isSavingStep && (
                                <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-30 transition-all duration-300">
                                    <div className="text-center">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#C8102E] border-r-transparent mb-4"></div>
                                        <p className="text-sm font-semibold text-gray-700">Đang lưu dữ liệu...</p>
                                    </div>
                                </div>
                            )}

                            {isLoadingData ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#C8102E] border-r-transparent mb-4"></div>
                                        <p className="text-gray-600">
                                            Đang tải dữ liệu phiên họp...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {currentStep === 1 && (
                                        <ChiTietHopStep
                                            data={chiTietData}
                                            onChange={setChiTietData}
                                            errors={chiTietErrors}
                                            isReadOnly={isReadOnly}
                                        />
                                    )}

                                    {currentStep === 2 && (
                                        <ThanhPhanThamDuStep
                                            data={thanhPhanData}
                                            onChange={setThanhPhanData}
                                            readOnly={isReadOnly}
                                        />
                                    )}

                                    {currentStep === 3 && (
                                        <ThongBaoGiayMoiStep
                                            data={thongBaoData}
                                            onChange={setThongBaoData}
                                            thanhPhanData={thanhPhanData}
                                            errors={thongBaoErrors}
                                            isReadOnly={isReadOnly}
                                        />
                                    )}

                                    {currentStep === 4 && (
                                        <NoiDungHopStep
                                            data={noiDungData}
                                            onChange={setNoiDungData}
                                            singleContentMode={false}
                                            errors={noiDungErrors}
                                            inheritedParticipants={
                                                thanhPhanData
                                            }
                                            isReadOnly={isReadOnly}
                                            isUpdateMode={isUpdateMode}
                                            meetingId={activeMeetingId || undefined}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        {/* Action Bar - Inside Card at Bottom */}
                        <div className="border-t border-gray-200 px-8 py-5">
                            <WizardFooter
                                currentStep={currentStep}
                                totalSteps={STEPS.length}
                                onBack={handleBack}
                                onNext={handleNext}
                                onSubmitForApproval={handleSubmitForApproval}
                                onSubmitMeeting={handleSubmitMeeting}
                                onSaveDraftAgenda={handleSaveDraftAgenda}
                                onCancel={handleCancelWithConfirm}
                                isLastStep={currentStep === STEPS.length}
                                approvalStatus={approvalStatus}
                                isUpdateMode={isUpdateMode}
                                isReadOnly={isReadOnly}
                                canApprove={canApprove}
                                onApprove={handleApprove}
                                onReject={handleRejectClick}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Từ chối phê duyệt phiên họp</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lý do từ chối <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rejectInput}
                            onChange={(e) => setRejectInput(e.target.value)}
                            placeholder="Nhập lý do từ chối phê duyệt..."
                            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                            required
                        />
                    </div>
                    <DialogFooter className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setIsRejectModalOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            className="bg-[#C8102E] text-white hover:bg-red-700"
                            onClick={handleConfirmReject}
                        >
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default TaoPhienHopPage;
