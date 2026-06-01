import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { toast } from '@/lib/toast';
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
    const departmentId = typeof user?.department === 'object' && user?.department !== null ? (user.department as any).id : null;

    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [approvalStatus, setApprovalStatus] =
        useState<ApprovalStatus>("draft");
    const [isLoadingData, setIsLoadingData] = useState(isUpdateMode || isCopyMode);
    const [highestStepReached, setHighestStepReached] = useState(1);
    const [activeMeetingId, setActiveMeetingId] = useState<string | null>(id || null);
    const [isSavingStep, setIsSavingStep] = useState(false);

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

    // Map meeting detail to form state from Real APIs
    const loadMeetingData = async (meetingId: string, isCopy = false) => {
        console.log("🔄 Start loading meeting data for ID:", meetingId, "isCopy:", isCopy);
        setIsLoadingData(true);

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

            console.log("✅ Real Meeting data loaded:", meeting);

            let parsedFile = null;
            let noiDungChuongTrinh: 'text' | 'upload' = 'text';
            let noiDungChuongTrinhText = "";

            if (meeting.content) {
                if (meeting.content.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(meeting.content);
                        if (parsed && (parsed.url || parsed.fileUrl)) {
                            parsedFile = parsed;
                            noiDungChuongTrinh = 'upload';
                        } else {
                            noiDungChuongTrinhText = meeting.content;
                        }
                    } catch (e) {
                        noiDungChuongTrinhText = meeting.content;
                    }
                } else {
                    noiDungChuongTrinhText = meeting.content;
                }
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
            console.log("📋 Setting Step 1 data:", step1Data);
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
            console.log("👥 Setting Step 2 data:", step2Data);
            setThanhPhanData(step2Data);

            // Map to Step 3 data (Thong bao)
            const step3Data: ThongBaoGiayMoiData = {
                mauGiayMoi: 'mau-1',
                tieuDe: meeting.title,
                noiDung: 'Trân trọng kính mời đồng chí tới tham dự cuộc họp...',
                trangThaiKy: 'co-ky',
            };
            setThongBaoData(step3Data);

            // Map to Step 4 data
            let step4Data: NoiDungHopData;
            
            if (isCopy) {
                step4Data = {
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
                };
            } else {
                step4Data = {
                    contents: agendaItems.length > 0 ? agendaItems.map((c: any) => ({
                        id: c.id,
                        noiDungChiTiet: c.title || "",
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
                        bieuQuyetIssues: [],
                        thanhPhanThamDu: {
                            donVi: [],
                            khachMoi: [],
                        }
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
                        }
                    ]
                };
            }
            console.log("📝 Setting Step 4 data:", step4Data);
            setNoiDungData(step4Data);

            // Mark all steps as completed in update mode or copy mode
            setCompletedSteps([1, 2, 3]);
            if (!isCopy) setCompletedSteps([1, 2, 3, 4]);

            // Cho phép click qua lại tất cả các bước đã có dữ liệu
            setHighestStepReached(4);

            console.log("✨ Data loading complete!");
        } catch (error) {
            console.error("❌ Error loading meeting data:", error);
            toast.error(
                "Không thể tải dữ liệu",
                "Đã xảy ra lỗi khi tải dữ liệu phiên họp. Vui lòng thử lại.",
            );
        } finally {
            setIsLoadingData(false);
        }
    };

    // Load data when in update mode or copy mode
    useEffect(() => {
        if (id) {
            console.log("Loading meeting data for id:", id);
            loadMeetingData(id, false);
        } else if (copyFromId) {
            console.log("Loading meeting data for copy from id:", copyFromId);
            loadMeetingData(copyFromId, true);
        } else {
            console.log("Create mode - not loading data");
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
        // Allow navigating freely up to highest step reached
        if (stepId <= highestStepReached) {
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
        if (currentStep === 1) {
            if (!validateStep1()) {
                return;
            }

            setIsSavingStep(true);
            try {
                let meetingContent = "";
                if (chiTietData.noiDungChuongTrinh === 'text') {
                    meetingContent = chiTietData.noiDungChuongTrinhText || "";
                } else if (chiTietData.noiDungChuongTrinh === 'upload') {
                    if (chiTietData.noiDungChuongTrinhFile instanceof File) {
                        toast.info("Đang tải tài liệu chương trình họp lên...");
                        const uploadRes = await meetingApi.uploadDocument(
                            chiTietData.noiDungChuongTrinhFile,
                            chiTietData.noiDungChuongTrinhFile.name,
                            'AGENDA',
                            'Tài liệu chương trình họp'
                        );
                        if (!uploadRes.success || !uploadRes.data) {
                            throw new Error(uploadRes.message || "Tải tài liệu chương trình họp thất bại");
                        }
                        const uploadedFile = uploadRes.data;
                        meetingContent = JSON.stringify({
                            id: uploadedFile.id,
                            name: uploadedFile.fileName || uploadedFile.title,
                            url: uploadedFile.fileUrl
                        });
                    } else if (chiTietData.noiDungChuongTrinhFile) {
                        // Giữ nguyên file cũ dưới dạng JSON
                        meetingContent = JSON.stringify(chiTietData.noiDungChuongTrinhFile);
                    }
                }

                const payload = {
                    title: chiTietData.tenPhienHop,
                    startTime: toLocalISOString(chiTietData.thoiGianBatDau),
                    endTime: toLocalISOString(chiTietData.thoiGianKetThuc),
                    locationId: chiTietData.diaDiem,
                    departmentId: departmentId || undefined,
                    content: meetingContent || undefined,
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
            } catch (err: any) {
                console.error("Error saving step 1:", err);
                toast.error("Lưu thông tin thất bại", err.message || "Vui lòng kiểm tra lại kết nối.");
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

            setIsSavingStep(true);
            try {
                const payload = {
                    participants: thanhPhanData.donVi.map(u => ({
                        userId: u.id,
                        participantRole: u.id === thanhPhanData.chuTriId ? 'CHAIR' : 'PARTICIPANT'
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
            } catch (err: any) {
                console.error("Error saving step 2:", err);
                toast.error("Lưu thành viên thất bại", err.message);
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
        }

        if (currentStep === 4) {
            if (!validateStep4()) {
                return;
            }
            if (!completedSteps.includes(4)) {
                setCompletedSteps([...completedSteps, 4]);
            }
        }

        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Helper Pipeline to save step 4 Agenda & Upload/Attach Files
    const saveAgendaItemsPipeline = async () => {
        if (!activeMeetingId) throw new Error("Thiếu ID cuộc họp");

        // Load existing agenda items to handle removed items
        let existingItems: any[] = [];
        try {
            const res = await meetingApi.getAgendaItems(activeMeetingId);
            if (res.success && res.data) existingItems = res.data;
        } catch (e) {
            console.error("Failed to load existing agenda items", e);
        }

        // Delete items that were removed
        const currentItemIds = noiDungData.contents.map(c => c.id).filter(id => !id.startsWith("content-"));
        for (const item of existingItems) {
            if (!currentItemIds.includes(item.id)) {
                try {
                    await meetingApi.deleteAgendaItem(activeMeetingId, item.id);
                } catch (e) {
                    console.error("Failed to delete removed agenda item", item.id, e);
                }
            }
        }

        // Save current items
        for (const [index, c] of noiDungData.contents.entries()) {
            const duration = Math.max(1, Math.round((new Date(c.thoiGianKetThuc).getTime() - new Date(c.thoiGianBatDau).getTime()) / 60000));
            const itemPayload = {
                title: c.noiDungChiTiet,
                content: undefined,
                durationEst: duration,
                preparedByUserId: c.nguoiChuanBi || undefined,
                startTime: toLocalISOString(c.thoiGianBatDau),
                endTime: toLocalISOString(c.thoiGianKetThuc),
                orderNo: index + 1,
            };

            let savedItem: any;
            if (c.id.startsWith("content-")) {
                const res = await meetingApi.createAgendaItem(activeMeetingId, itemPayload);
                if (!res.success) throw new Error(`Tạo đầu mục "${c.noiDungChiTiet}" thất bại`);
                savedItem = res.data;
            } else {
                const res = await meetingApi.updateAgendaItem(activeMeetingId, c.id, itemPayload);
                if (!res.success) throw new Error(`Cập nhật đầu mục "${c.noiDungChiTiet}" thất bại`);
                savedItem = res.data;
            }

            // Upload and attach new files
            if (c.taiLieu && c.taiLieu.length > 0) {
                for (const file of c.taiLieu) {
                    if (file instanceof File) {
                        try {
                            const uploadRes = await meetingApi.uploadDocument(file, file.name, 'OTHER');
                            if (uploadRes.success && uploadRes.data) {
                                const docId = uploadRes.data.id;
                                await meetingApi.attachDocument(activeMeetingId, {
                                    documentId: docId,
                                    agendaItemId: savedItem.id,
                                    usageType: 'AGENDA_ITEM',
                                    requiredBeforeMeeting: false,
                                    isConfidential: false
                                });
                            }
                        } catch (e) {
                            console.error("Failed to upload/attach file for agenda item", file.name, e);
                        }
                    }
                }
            }
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
            navigate("/phien-hop");
        } catch (err: any) {
            console.error("Failed to submit for approval:", err);
            toast.error("Gửi phê duyệt thất bại", err.message);
        } finally {
            setIsSavingStep(false);
        }
    };

    const handleSubmitMeeting = async () => {
        if (!validateStep4()) {
            return;
        }

        setIsSavingStep(true);
        try {
            await saveAgendaItemsPipeline();

            if (isUpdateMode) {
                toast.success(
                    "Cập nhật phiên họp thành công",
                    `Thông tin phiên họp "${chiTietData.tenPhienHop}" đã được cập nhật`,
                );
                navigate(`/phien-hop/${activeMeetingId}`);
            } else {
                const res = await meetingApi.publishMeeting(activeMeetingId!);
                if (!res.success) throw new Error(res.message || "Công bố thất bại");

                toast.success(
                    "Tạo phiên họp thành công",
                    `Đã tạo và công bố phiên họp "${chiTietData.tenPhienHop}" thành công`,
                );
                navigate("/phien-hop");
            }
        } catch (err: any) {
            console.error("Failed to complete meeting creation:", err);
            toast.error("Thao tác thất bại", err.message);
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
                        onClick={() =>
                            navigate(
                                isUpdateMode
                                    ? `/phien-hop/${id}`
                                    : "/phien-hop",
                            )
                        }
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-3"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm body">
                            {isUpdateMode
                                ? "Quay lại chi tiết phiên họp"
                                : "Quay lại danh sách"}
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
                                        />
                                    )}

                                    {currentStep === 2 && (
                                        <ThanhPhanThamDuStep
                                            data={thanhPhanData}
                                            onChange={setThanhPhanData}
                                        />
                                    )}

                                    {currentStep === 3 && (
                                        <ThongBaoGiayMoiStep
                                            data={thongBaoData}
                                            onChange={setThongBaoData}
                                            thanhPhanData={thanhPhanData}
                                            errors={thongBaoErrors}
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
                                onCancel={() =>
                                    navigate(
                                        isUpdateMode
                                            ? `/phien-hop/${id}`
                                            : "/phien-hop",
                                    )
                                }
                                isLastStep={currentStep === STEPS.length}
                                approvalStatus={approvalStatus}
                                isUpdateMode={isUpdateMode}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TaoPhienHopPage;
