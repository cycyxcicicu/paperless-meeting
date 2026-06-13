import { User } from '@/app/context/AuthContext';
import { PositionCode } from '@/common/types/position';

export const hasRoutePermission = (user: User | null, path: string): boolean => {
  if (!user) return false;

  const role = user.role?.roleCode || 'USER';
  
  // 1. SUPER_ADMIN thấy được tất cả
  if (role === 'SUPER_ADMIN') {
    return true; 
  }
  
  // 2. DEPARTMENT_ADMIN (Trang chủ, Quản lý (ngoại trừ Vai trò và Cấu hình hệ thống), Phòng họp, Phiên họp)
  if (role === 'DEPARTMENT_ADMIN') {
    // Chặn danh sách vai trò
    if (path === '/nguoi-dung/vai-tro' || path.startsWith('/nguoi-dung/vai-tro/')) return false;
    // Chặn cấu hình hệ thống
    if (path === '/cau-hinh' || path.startsWith('/cau-hinh/')) return false;
    
    const allowedPrefixes = ['/', '/nguoi-dung', '/phong-hop', '/phien-hop'];
    return allowedPrefixes.some(prefix => {
      if (prefix === '/') return path === '/';
      return path.startsWith(prefix);
    });
  }
  
  // 3. USER (Trang chủ, lịch họp, quản lý họp. KHÔNG có Mẫu thư mời trừ khi có quyền tạo cuộc họp)
  if (role === 'USER') {
    const posCode = user.position?.positionCode;
    const canCreateMeeting = posCode === PositionCode.THU_KY;

    // Kiểm tra các trang yêu cầu quyền tạo cuộc họp
    if (path === '/phien-hop/mau-thu-moi' || path.startsWith('/phien-hop/mau-thu-moi/')) {
        return !!canCreateMeeting;
    }
    if (path === '/phien-hop/tao-moi') {
        return !!canCreateMeeting;
    }
    if (path.includes('/cap-nhat')) {
        const isLeader = posCode === 'CHU_TICH' || posCode === 'GIAM_DOC';
        return !!canCreateMeeting || isLeader;
    }

    // Các đường dẫn mà USER được truy cập mặc định:
    // Trang chủ
    if (path === '/') return true;
    // Lịch họp (LichHopPage)
    if (path === '/phong-hop') return true;
    // Địa điểm họp: USER bình thường KHÔNG được xem, nên ta chặn tuyệt đối
    if (path === '/phong-hop/dia-diem' || path.startsWith('/phong-hop/dia-diem/')) return false;
    
    // Lịch họp (LichHopPage)
    if (path === '/phong-hop' || path.startsWith('/phong-hop/')) return true;
    
    // Phiên họp (Quản lý phiên họp chung, chi tiết, tài liệu, diễn biến...)
    if (path.startsWith('/phien-hop')) return true;
    
    return false;
  }
  
  return false;
};
