import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "../../lib/toast";
import { Sidebar } from "../components/layout/Sidebar";
import {
    ChiTietHopData,
    ChiTietHopStep,
} from "../components/meeting/ChiTietHopStep";
import {
    NoiDungHopData,
    NoiDungHopStep,
} from "../components/meeting/NoiDungHopStep";
import {
    ThanhPhanThamDuData,
    ThanhPhanThamDuStep,
} from "../components/meeting/ThanhPhanThamDuStep";
import { WizardFooter } from "../components/meeting/WizardFooter";
import { WizardStepper } from "../components/meeting/WizardStepper";

import { PHIEN_HOP_SIDEBAR_ITEMS } from "../constants/sidebar";
const STEPS = [
    {
        id: 1,
        title: "Chi tiết họp",
        description: "Thông tin cơ bản",
    },
    {
        id: 2,
        title: "Thành phần tham dự",
        description: "Đơn vị và cá nhân",
    },
    {
        id: 3,
        title: "Nội dung họp",
        description: "Chi tiết và tài liệu",
    },
];

type ApprovalStatus = "draft" | "pending" | "approved" | "sent";

const TaoPhienHopPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isUpdateMode = !!id; // Nếu có id thì là mode update

    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [approvalStatus, setApprovalStatus] =
        useState<ApprovalStatus>("draft");
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Step 1 data
    const [chiTietData, setChiTietData] = useState<ChiTietHopData>({
        tenPhienHop: "",
        thoiGianBatDau: "",
        thoiGianKetThuc: "",
        diaDiem: "",
        noiDungChuongTrinh: "text",
        noiDungChuongTrinhText: "",
        giayMoiFile: null,
        loaiPhienHop: "",
        linkHopTrucTuyen: "",
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
    const loadMeetingData = (meetingId: string) => {
        console.log("🔄 Start loading meeting data for ID:", meetingId);
        setIsLoadingData(true);

        try {
            const meeting = getMeetingDetail(meetingId);
            console.log("✅ Meeting data loaded:", meeting);

            // Map to Step 1 data
            const step1Data: ChiTietHopData = {
                tenPhienHop: meeting.tenPhienHop,
                thoiGianBatDau: meeting.thoiGianBatDau,
                thoiGianKetThuc: meeting.thoiGianKetThuc,
                diaDiem: meeting.diaDiem,
                noiDungChuongTrinh: meeting.noiDungChuongTrinh as "text" | "upload",
                noiDungChuongTrinhText: meeting.noiDungChuongTrinhText,
                giayMoiFile: meeting.giayMoiFile,
                loaiPhienHop: meeting.loaiPhienHop,
                linkHopTrucTuyen: meeting.linkHopTrucTuyen,
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

            // Map to Step 3 data
            const step3Data: NoiDungHopData = {
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
            console.log("📝 Setting Step 3 data:", step3Data);
            setNoiDungData(step3Data);

            // Mark all steps as completed in update mode
            setCompletedSteps([1, 2]);
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

    // Load data when in update mode
    useEffect(() => {
        if (id) {
            console.log("Loading meeting data for id:", id);
            loadMeetingData(id);
        } else {
            console.log("Create mode - not loading data");
        }
    }, [id]);

    // Validation
    const validateStep1 = (): boolean => {
        const errors: Record<string, string> = {};

        if (!chiTietData.tenPhienHop.trim()) {
            errors.tenPhienHop = "Vui lòng nhập tên phiên họp";
        }

        if (!chiTietData.thoiGianBatDau) {
            errors.thoiGianBatDau = "Vui lòng chọn thời gian bắt đầu";
        }

        if (!chiTietData.thoiGianKetThuc) {
            errors.thoiGianKetThuc = "Vui lòng chọn thời gian kết thúc";
        }

        if (!chiTietData.diaDiem.trim()) {
            errors.diaDiem = "Vui lòng nhập địa điểm";
        }

        if (
            chiTietData.thoiGianBatDau &&
            chiTietData.thoiGianKetThuc &&
            new Date(chiTietData.thoiGianBatDau) >=
                new Date(chiTietData.thoiGianKetThuc)
        ) {
            errors.thoiGianKetThuc =
                "Thời gian kết thúc phải sau thời gian bắt đầu";
        }

        setChiTietErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep3 = (): boolean => {
        const errors: Record<string, any> = {};

        noiDungData.contents.forEach((content) => {
            if (!content.noiDungChiTiet.trim()) {
                errors[content.id] = {
                    noiDungChiTiet: "Vui lòng nhập nội dung chi tiết",
                };
            }
        });

        setNoiDungErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Step click handler
    const handleStepClick = (stepId: number) => {
        // Allow going back to any previous step
        if (stepId < currentStep) {
            setCurrentStep(stepId);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        // Allow going to next step only if current step is valid
        if (stepId === currentStep + 1) {
            handleNext();
            return;
        }

        // Allow going to completed steps
        if (completedSteps.includes(stepId)) {
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
            noiDungData,
        });
        toast.success(
            "Lưu nháp thành công",
            "Dữ liệu phiên họp đã được lưu dưới dạng bản nháp",
        );
    };

    const handleSubmitForApproval = () => {
        if (!validateStep3()) {
            return;
        }

        console.log("Submit for approval:", {
            chiTietData,
            thanhPhanData,
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

        if (!validateStep3()) {
            return;
        }

        const payload = {
            chiTietData,
            thanhPhanData,
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
                        <span className="text-sm font-medium">
                            {isUpdateMode
                                ? "Quay lại chi tiết phiên họp"
                                : "Quay lại danh sách"}
                        </span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
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
