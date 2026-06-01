import * as z from 'zod';

// 1. Zod schema cho form Thêm/Cập nhật khách mời
export const guestValidationSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập họ và tên'),
  gender: z.string().min(1, 'Vui lòng chọn giới tính'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
  phone: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  unit: z.string().min(1, 'Vui lòng nhập đơn vị công tác'),
  position: z.string().min(1, 'Vui lòng nhập chức vụ'),
  description: z.string().optional(),
});

// 2. Zod schema cho form Bước 1 (Chi tiết phiên họp)
export const chiTietHopSchema = z.object({
  tenPhienHop: z.string().min(1, 'Vui lòng nhập tên phiên họp'),
  thoiGianBatDau: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
  thoiGianKetThuc: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
  diaDiem: z.string().min(1, 'Vui lòng chọn địa điểm họp'),
  linkHopTrucTuyen: z.string().url('Link không đúng định dạng').optional().or(z.literal('')),
  soPhutDenMuon: z.coerce.number().min(0, 'Số phút đến muộn không được âm').optional(),
}).superRefine((data, ctx) => {
  if (data.thoiGianBatDau && data.thoiGianKetThuc) {
    const start = new Date(data.thoiGianBatDau).getTime();
    const end = new Date(data.thoiGianKetThuc).getTime();
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
        path: ['thoiGianKetThuc'],
      });
    }
  }
});

// 3. Zod schema cho form Bước 3 (Thông báo & Giấy mời)
export const thongBaoGiayMoiSchema = z.object({
  mauGiayMoi: z.string().optional().or(z.literal('')),
  tieuDe: z.string().min(5, 'Tiêu đề phải từ 5 ký tự trở lên').optional().or(z.literal('')),
  noiDung: z.string().min(10, 'Nội dung thư mời phải từ 10 ký tự trở lên').optional().or(z.literal('')),
  trangThaiKy: z.string().optional().or(z.literal('')),
});

// 4. Zod schema cho Bước 4 (Nội dung họp)
// Validate từng item trong mảng nội dung
const noiDungItemSchema = z.object({
  id: z.string(),
  noiDungChiTiet: z.string().min(1, 'Vui lòng nhập nội dung chi tiết'),
  thoiGianBatDau: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
  thoiGianKetThuc: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
}).superRefine((data, ctx) => {
  if (data.thoiGianBatDau && data.thoiGianKetThuc) {
    const start = new Date(data.thoiGianBatDau).getTime();
    const end = new Date(data.thoiGianKetThuc).getTime();
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kết thúc phải sau bắt đầu',
        path: ['thoiGianKetThuc'],
      });
    }
  }
});

// Schema cho toàn bộ mảng nội dung (bao gồm check tuần tự và giới hạn phiên họp)
// Lưu ý: Việc check logic liên quan đến thoiGianBatDau/KetThuc của toàn bộ phiên họp 
// sẽ được check bằng thủ công kết hợp trong code vì cần dữ liệu từ Bước 1.
export const noiDungHopSchema = z.object({
  contents: z.array(noiDungItemSchema)
});
