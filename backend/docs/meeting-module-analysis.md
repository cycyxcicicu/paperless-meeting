# Meeting Module Analysis

*Tài liệu này phân tích cấu trúc, flow và các phần còn thiếu cụ thể của module Meeting dựa trên mã nguồn hiện tại.*

## 1. Trạng thái (Meeting Status Flow)
Enum `MeetingStatus` trong mã nguồn hiện có các trạng thái sau:
- `DRAFT`: Đang nháp, có thể sửa đổi hoàn toàn.
- `PENDING_APPROVAL`: Đã trình duyệt, chờ `DEPARTMENT_ADMIN` duyệt.
- `REJECTED`: Bị từ chối phê duyệt. Có thể sửa và trình lại.
- `UPCOMING`: Đã duyệt, đang chờ đến giờ.
- `IN_PROGRESS`: Đang diễn ra.
- `CLOSED`: Đã kết thúc.
- `CANCELLED`: Đã hủy.

**Tự động hóa (Cron Job)**:
Hệ thống sử dụng file `MeetingStatusJob.java` để quét tự động mỗi phút. Khi một cuộc họp đang ở `UPCOMING` và `startTime <= now()`, hệ thống sẽ tự động cập nhật sang `IN_PROGRESS`.

## 2. Các API hiện có (MeetingController)
- `GET /meetings`: Phân trang, có filter động theo keyword, status, date (sử dụng `MeetingSpecification`).
- `GET /meetings/{id}`: Chi tiết cuộc họp.
- `POST /meetings`: Tạo mới (Trạng thái mặc định là `DRAFT`).
- `PUT /meetings/{id}`: Sửa cuộc họp (chỉ cho phép khi `DRAFT` hoặc `REJECTED`).
- `POST /meetings/{id}/submit-approval`: Trình duyệt (`DRAFT` -> `PENDING_APPROVAL`).
- `POST /meetings/{id}/approve`: Phê duyệt (`PENDING_APPROVAL` -> `UPCOMING`).
- `POST /meetings/{id}/reject`: Từ chối (`PENDING_APPROVAL` -> `REJECTED`).
- `POST /meetings/{id}/cancel`: Hủy (`UPCOMING` / `PENDING_APPROVAL` -> `CANCELLED`).
- `POST /meetings/{id}/close`: Kết thúc (`IN_PROGRESS` -> `CLOSED`).

## 3. Các Logic thiếu (Gaps for Frontend)
Dù luồng trạng thái cuộc họp đã gần như hoàn thiện, nhưng một cuộc họp cần có người tham dự, nội dung (agenda), tài liệu. Các phần này đang có Entities nhưng **thiếu hoàn toàn API**:

### a. Meeting Participant
- **Entity**: `MeetingParticipant` (meeting, user, role, rsvp status, attendance status).
- **Request DTOs đã có**: `AddParticipantRequest`, `UpdateAttendanceStatusRequest`...
- **Vấn đề**: Chưa có Endpoint nào để chủ tọa/người tạo họp gán thành viên vào cuộc họp. Backend không thể test hay cấp role cuộc họp nếu không có controller này.

### b. Agenda & Documents
- **Entity**: `AgendaItem`, `MeetingDocument`.
- **Vấn đề**: Việc tạo cuộc họp `MeetingUpsertRequest` hiện tại chỉ map thông tin cơ bản. Nội dung chương trình (Agenda) và tài liệu đính kèm (Documents) cần có luồng API riêng hoặc được lồng ghép vào lúc update draft meeting.

## 4. Open Questions
- Với API gán người tham dự (Participant), việc kiểm tra conflict lịch họp của từng người dùng có cần thiết ngay lúc add hay chỉ cảnh báo?
- Trong meeting, ai có quyền thêm `MeetingParticipant`? Người tạo meeting, DEPARTMENT_ADMIN hay CHAIR?
