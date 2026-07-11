import { describe, it, expect } from 'vitest';
import {
  guestValidationSchema,
  chiTietHopSchema,
  thongBaoGiayMoiSchema,
  noiDungHopSchema,
} from '../meeting.validation';

describe('meeting.validation - guestValidationSchema', () => {
  const validGuest = {
    name: 'Nguyễn Văn A',
    gender: 'Nam',
    email: 'nva@gmail.com',
    phone: '0987654321',
    unit: 'Sở Ngoại Vụ',
    position: 'Chuyên viên',
    description: 'Khách mời đại biểu',
  };

  it('should pass validation with valid guest data', () => {
    const result = guestValidationSchema.safeParse(validGuest);
    expect(result.success).toBe(true);
  });

  it('should fail validation when guest name is missing', () => {
    const result = guestValidationSchema.safeParse({ ...validGuest, name: '' });
    expect(result.success).toBe(false);
  });

  it('should fail validation when guest email is invalid', () => {
    const result = guestValidationSchema.safeParse({ ...validGuest, email: 'invalid-email' });
    expect(result.success).toBe(false);
  });

  it('should fail validation when guest phone is invalid', () => {
    const result = guestValidationSchema.safeParse({ ...validGuest, phone: '12345' });
    expect(result.success).toBe(false);
  });
});

describe('meeting.validation - chiTietHopSchema', () => {
  const validMeetingDetails = {
    tenPhienHop: 'Họp giao ban Quý 1',
    thoiGianBatDau: '2026-10-10T08:00:00.000Z',
    thoiGianKetThuc: '2026-10-10T10:00:00.000Z',
    diaDiem: 'Phòng họp trực tuyến',
    linkHopTrucTuyen: 'https://zoom.us/j/123456789',
    soPhutDenMuon: 15,
  };

  it('should pass validation with valid meeting details', () => {
    const result = chiTietHopSchema.safeParse(validMeetingDetails);
    expect(result.success).toBe(true);
  });

  it('should fail validation when meeting name is missing', () => {
    const result = chiTietHopSchema.safeParse({ ...validMeetingDetails, tenPhienHop: '' });
    expect(result.success).toBe(false);
  });

  it('should fail validation when endTime is before startTime', () => {
    const result = chiTietHopSchema.safeParse({
      ...validMeetingDetails,
      thoiGianBatDau: '2026-10-10T10:00:00.000Z',
      thoiGianKetThuc: '2026-10-10T09:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('should fail validation when late minutes is negative', () => {
    const result = chiTietHopSchema.safeParse({ ...validMeetingDetails, soPhutDenMuon: -5 });
    expect(result.success).toBe(false);
  });
});

describe('meeting.validation - thongBaoGiayMoiSchema', () => {
  const validNoticeWithInvitation = {
    coGiayMoi: true,
    mauGiayMoi: 'Mẫu số 1',
    tieuDe: 'Thư mời họp giao ban',
    noiDung: 'Kính mời đồng chí tham gia cuộc họp giao ban Quý 1.',
    trangThaiKy: 'ACTIVE',
  };

  it('should pass validation with valid invitation notice', () => {
    const result = thongBaoGiayMoiSchema.safeParse(validNoticeWithInvitation);
    expect(result.success).toBe(true);
  });

  it('should fail validation when coGiayMoi is true and mauGiayMoi is empty', () => {
    const result = thongBaoGiayMoiSchema.safeParse({
      ...validNoticeWithInvitation,
      mauGiayMoi: '',
    });
    expect(result.success).toBe(false);
  });

  it('should fail validation when coGiayMoi is true and invitation content is too short', () => {
    const result = thongBaoGiayMoiSchema.safeParse({
      ...validNoticeWithInvitation,
      noiDung: 'Ngắn',
    });
    expect(result.success).toBe(false);
  });
});

describe('meeting.validation - noiDungHopSchema', () => {
  const validAgenda = {
    contents: [
      {
        id: '1',
        noiDungChiTiet: 'Báo cáo tình hình kinh tế xã hội',
        thoiGianBatDau: '2026-10-10T08:00:00.000Z',
        thoiGianKetThuc: '2026-10-10T08:30:00.000Z',
      },
    ],
  };

  it('should pass validation with valid agenda items', () => {
    const result = noiDungHopSchema.safeParse(validAgenda);
    expect(result.success).toBe(true);
  });

  it('should fail validation when agenda item endTime is before startTime', () => {
    const result = noiDungHopSchema.safeParse({
      contents: [
        {
          id: '1',
          noiDungChiTiet: 'Báo cáo',
          thoiGianBatDau: '2026-10-10T08:30:00.000Z',
          thoiGianKetThuc: '2026-10-10T08:00:00.000Z',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
