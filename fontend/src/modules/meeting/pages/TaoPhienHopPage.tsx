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

const TaoPhienHopPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isUpdateMode = !!id; // Nếu có id thì là mode update
    const copyFromId = location.state?.copyFromId;
    const isCopyMode = !!copyFromId;

    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [approvalStatus, setApprovalStatus] =
        useState<ApprovalStatus>("draft");
    const [isLoadingData, setIsLoadingData] = useState(isUpdateMode || isCopyMode);
    const [highestStepReached, setHighestStepReached] = useState(1);

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
                    caNhan: [],
                    khachMoi: [],
                    nhomThanhVien: [],
                },
            },
        ],
    });

    const [noiDungErrors, setNoiDungErrors] = useState<Record<string, any>>({});

    // Mock function to get meeting detail
    const getMeetingDetail = (meetingId: string) => {
        // Mock data - trong thực tế sẽ gọi API
        return {
            id: meetingId,
            tenPhienHop: "Họp triển khai kế hoạch quý II/2026",
            thoiGianBatDau: "2026-04-17T08:30",
            thoiGianKetThuc: "2026-04-17T11:00",
            diaDiem: "Hội trường lớn - Tầng 1",
            loaiPhienHop: "hop-ban-chap-hanh",
            linkHopTrucTuyen: "https://meet.google.com/abc-defg-hij",
            noiDungChuongTrinh: "text",
            noiDungChuongTrinhText:
                "Thảo luận và triển khai các nhiệm vụ trọng tâm quý II/2026",
            giayMoiFile: null,
            chuTriId: "user-1",
            donVi: [
                { id: "dv-1", name: "Sở Kế hoạch và Đầu tư" },
                { id: "dv-2", name: "Sở Tài chính" },
            ],
            caNhan: [
                {
                    id: "user-1",
                    name: "Ông Trần Văn A",
                    chucVu: "Bí thư",
                    donVi: "Thành ủy",
                },
                {
                    id: "user-2",
                    name: "Bà Nguyễn Thị B",
                    chucVu: "Phó Bí thư",
                    donVi: "Thành ủy",
                },
            ],
            khachMoi: [
                {
                    id: "guest-1",
                    name: "Ông Lê Văn C",
                    donVi: "Công ty ABC",
                    email: "levanc@abc.com",
                },
            ],
            nhomThanhVien: [
                { id: "group-1", name: "Ban Thường vụ Thành ủy", soLuong: 15 },
            ],
            contents: [
                {
                    id: "content-1",
                    noiDungChiTiet:
                        "Báo cáo tình hình kinh tế - xã hội quý I/2026",
                    thoiGianBatDau: "2026-04-17T08:30",
                    thoiGianKetThuc: "2026-04-17T09:30",
                    nguoiChuanBi: "user-3",
                    nguoiDuyet: "user-1",
                    taiLieu: [
                        {
                            id: "doc-1",
                            name: "Báo cáo tình hình Q1.pdf",
                            size: 2400000,
                            url: "#",
                        },
                    ],
                    bieuQuyetIssues: [
                        {
                            id: "issue-1",
                            title: "Phê duyệt ngân sách bổ sung",
                            description: "Bổ sung 5 tỷ đồng cho dự án hạ tầng",
                        },
                    ],
                    thanhPhanThamDu: {
                        donVi: ["dv-1"],
                        caNhan: ["user-1", "user-2"],
                        khachMoi: [],
                        nhomThanhVien: ["group-1"],
                    },
                },
                {
                    id: "content-2",
                    noiDungChiTiet: "Triển khai kế hoạch quý II/2026",
                    thoiGianBatDau: "2026-04-17T09:30",
                    thoiGianKetThuc: "2026-04-17T11:00",
                    nguoiChuanBi: "user-4",
                    nguoiDuyet: "user-1",
                    taiLieu: [],
                    bieuQuyetIssues: [],
                    thanhPhanThamDu: {
                        donVi: [],
                        caNhan: [],
                        khachMoi: [],
                        nhomThanhVien: [],
                    },
                },
            ],
        };
    };

    // Map meeting detail to form state
    const loadMeetingData = (meetingId: string, isCopy = false) => {
        console.log("🔄 Start loading meeting data for ID:", meetingId, "isCopy:", isCopy);
        setIsLoadingData(true);

        try {
            const meeting = getMeetingDetail(meetingId);
            console.log("✅ Meeting data loaded:", meeting);

            // Map to Step 1 data
            const step1Data: ChiTietHopData = {
                tenPhienHop: isCopy ? `${meeting.tenPhienHop} - Bản sao` : meeting.tenPhienHop,
                thoiGianBatDau: meeting.thoiGianBatDau,
                thoiGianKetThuc: meeting.thoiGianKetThuc,
                diaDiem: meeting.diaDiem,
                linkHopTrucTuyen: meeting.linkHopTrucTuyen,
                soPhutDenMuon: 0,
                noiDungChuongTrinh: meeting.noiDungChuongTrinh as "text" | "upload",
                noiDungChuongTrinhText: meeting.noiDungChuongTrinhText,
            };
            console.log("📋 Setting Step 1 data:", step1Data);
            setChiTietData(step1Data);

            // Map to Step 2 data
            const step2Data: ThanhPhanThamDuData = {
                donVi: meeting.donVi.map(d => ({ id: d.id, name: d.name, position: '', unit: d.name, unitId: d.id, email: '' })),
                caNhan: meeting.caNhan.map(c => ({ id: c.id, name: c.name, position: c.chucVu, unit: c.donVi, unitId: '', email: '' })),
                nhomThanhVien: meeting.nhomThanhVien,
                khachMoi: meeting.khachMoi,
                chuTriId: meeting.chuTriId,
            };
            console.log("👥 Setting Step 2 data:", step2Data);
            setThanhPhanData(step2Data);

            // Map to Step 3 data (Thong bao)
            const step3Data: ThongBaoGiayMoiData = {
                mauGiayMoi: 'mau-1',
                tieuDe: meeting.tenPhienHop,
                noiDung: 'Trân trọng kính mời đồng chí tới tham dự cuộc họp...',
                trangThaiKy: 'co-ky',
            };
            setThongBaoData(step3Data);

            // Map to Step 4 data
            let step4Data: NoiDungHopData;
            
            if (isCopy) {
                // If copying, leave contents empty
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
                                caNhan: [],
                                khachMoi: [],
                                nhomThanhVien: [],
                            },
                        },
                    ],
                };
            } else {
                step4Data = {
                    contents: meeting.contents.map(c => ({
                        id: c.id,
                        noiDungChiTiet: c.noiDungChiTiet,
                        thoiGianBatDau: c.thoiGianBatDau,
                        thoiGianKetThuc: c.thoiGianKetThuc,
                        nguoiChuanBi: c.nguoiChuanBi,
                        nguoiDuyet: c.nguoiDuyet,
                        taiLieu: [] as File[],
                        bieuQuyetIssues: c.bieuQuyetIssues.map(b => ({
                            id: b.id,
                            ten: b.title,
                            moTa: b.description
                        })),
                        thanhPhanThamDu: {
                            donVi: c.thanhPhanThamDu.donVi.map(id => ({ id, name: 'Đơn vị', position: '', unit: '', unitId: id, email: '' })),
                            caNhan: c.thanhPhanThamDu.caNhan.map(id => ({ id, name: 'Cá nhân', position: '', unit: '', unitId: '', email: '' })),
                            khachMoi: c.thanhPhanThamDu.khachMoi,
                            nhomThanhVien: c.thanhPhanThamDu.nhomThanhVien.map(id => ({ id, name: 'Nhóm', soLuong: 0 }))
                        }
                    }))
                };
            }
            console.log("📝 Setting Step 4 data:", step4Data);
            setNoiDungData(step4Data);

            // Mark all steps as completed in update mode or copy mode
            setCompletedSteps([1, 2, 3]); // Do not mark step 4 as completed for copy mode
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

    // Navigation handlers
    const handleNext = () => {
        if (currentStep === 1) {
            if (!validateStep1()) {
                return;
            }
            // Mark step 1 as completed
            if (!completedSteps.includes(1)) {
                setCompletedSteps([...completedSteps, 1]);
            }
        }

        if (currentStep === 2) {
            // Mark step 2 as completed
            if (!completedSteps.includes(2)) {
                setCompletedSteps([...completedSteps, 2]);
            }
        }

        if (currentStep === 3) {
            if (!validateStep3()) {
                return;
            }
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

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleSaveDraft = () => {
        console.log("Save draft:", {
            chiTietData,
            thanhPhanData,
            thongBaoData,
            noiDungData,
        });
        toast.success(
            "Lưu nháp thành công",
            "Dữ liệu phiên họp đã được lưu dưới dạng bản nháp",
        );
    };

    const handleSubmitForApproval = () => {
        if (!validateStep4()) {
            return;
        }

        console.log("Submit for approval:", {
            chiTietData,
            thanhPhanData,
            thongBaoData,
            noiDungData,
        });

        // Change status to pending approval
        setApprovalStatus("pending");
        toast.success(
            "Gửi phê duyệt thành công",
            "Phiên họp đã được gửi đi. Vui lòng chờ phê duyệt để tiếp tục.",
        );

        // Simulate approval after 2 seconds (in real app, this would come from server/user action)
        setTimeout(() => {
            setApprovalStatus("approved");
            toast.success(
                "Phê duyệt thành công",
                "Phiên họp đã được phê duyệt. Bạn có thể gửi phiên họp ngay bây giờ.",
            );
        }, 2000);
    };

    const handleSubmitMeeting = () => {
        if (!isUpdateMode && approvalStatus !== "approved") {
            toast.warning(
                "Chưa được phê duyệt",
                "Vui lòng gửi phê duyệt và chờ được duyệt trước khi gửi phiên họp",
            );
            return;
        }

        if (!validateStep4()) {
            return;
        }

        const payload = {
            chiTietData,
            thanhPhanData,
            thongBaoData,
            noiDungData,
        };

        if (isUpdateMode) {
            // Call update API
            console.log("Update meeting:", id, payload);
            toast.success(
                "Cập nhật phiên họp thành công",
                `Thông tin phiên họp "${chiTietData.tenPhienHop}" đã được cập nhật`,
            );
            navigate(`/phien-hop/${id}`);
        } else {
            // Call create API
            console.log("Create meeting:", payload);
            setApprovalStatus("sent");
            toast.success(
                "Tạo phiên họp thành công",
                `Đã tạo phiên họp "${chiTietData.tenPhienHop}" thành công`,
            );
            navigate("/phien-hop");
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
                        <div className="px-8 py-6">
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
                                onSaveDraft={handleSaveDraft}
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
