export const mockPreviewData: Record<string, string> = {
  organizationName: "ỦY BAN NHÂN DÂN QUẬN A",
  departmentName: "PHÒNG NỘI VỤ",
  locationName: "Hải Phòng",
  day: "17",
  month: "05",
  year: "2026",
  receiverName: "Nguyễn Văn A",
  receiverPosition: "Trưởng phòng",
  receiverDepartment: "Phòng Kế hoạch",
  meetingName: "Họp xét duyệt hồ sơ",
  meetingTime: "08:30 ngày 20/05/2026",
  meetingLocation: "Phòng họp tầng 3",
  meetingContent: "Xét duyệt danh sách hồ sơ đăng ký",
  invitationContent: "Trân trọng kính mời đồng chí đến tham dự phiên họp để trao đổi và thảo luận các vấn đề quan trọng.",
  signerName: "Nguyễn Văn B",
  signerPosition: "Chủ tịch hội đồng",
  docNumber: "123/GM-UBND"
};

export const variablesList = [
  { label: 'Tên cơ quan', key: 'organizationName' },
  { label: 'Tên phòng ban', key: 'departmentName' },
  { label: 'Địa danh', key: 'locationName' },
  { label: 'Ngày', key: 'day' },
  { label: 'Tháng', key: 'month' },
  { label: 'Năm', key: 'year' },
  { label: 'Tên người nhận', key: 'receiverName' },
  { label: 'Chức vụ người nhận', key: 'receiverPosition' },
  { label: 'Đơn vị người nhận', key: 'receiverDepartment' },
  { label: 'Tên cuộc họp', key: 'meetingName' },
  { label: 'Thời gian họp', key: 'meetingTime' },
  { label: 'Địa điểm họp', key: 'meetingLocation' },
  { label: 'Nội dung họp', key: 'meetingContent' },
  { label: 'Nội dung thư mời', key: 'invitationContent' },
  { label: 'Người ký', key: 'signerName' },
  { label: 'Chức vụ người ký', key: 'signerPosition' },
  { label: 'Số/Ký hiệu', key: 'docNumber' }
];

export const defaultTemplate = {
  tenMau: "Thư mời họp hội đồng",
  maMau: "THU_MOI_HOP_HOI_DONG",
  headerTrai: "{{organizationName}}\n{{departmentName}}",
  headerPhai: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc",
  ngayThang: "{{locationName}}, ngày {{day}} tháng {{month}} năm {{year}}",
  tieuDe: "THƯ MỜI",
  trichYeu: "Về việc: Tham dự cuộc họp {{meetingName}}",
  noiDung: "<p>Trân trọng kính mời ông/bà <strong>{{receiverName}}</strong>, {{receiverPosition}} - {{receiverDepartment}} tham dự cuộc họp <strong>{{meetingName}}</strong>.</p><p><br></p><p><strong>Thời gian:</strong> {{meetingTime}}<br><strong>Địa điểm:</strong> {{meetingLocation}}</p><p><br></p><p><strong>Nội dung thư mời:</strong><br>{{invitationContent}}</p><p><br></p><p><strong>Nội dung cuộc họp:</strong><br>{{meetingContent}}</p><p><br></p><p>Rất mong ông/bà tham dự đầy đủ, đúng giờ.</p>",
  chuKy: "{{signerPosition}}\n\n\n\n{{signerName}}",
  hienThiNoiNhan: true,
  khoGiay: "A4" as "A4" | "A6"
};

export type TemplateField = keyof typeof defaultTemplate;

export const compileTemplate = (text: string) => {
  if (!text) return '';
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return mockPreviewData[key] !== undefined ? mockPreviewData[key] : match;
  });
};

