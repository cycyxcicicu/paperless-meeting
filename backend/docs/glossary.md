# Glossary — Paperless Meeting (Thuật ngữ chuyên môn)

Đây là tập hợp định nghĩa ngắn, cụ thể dành cho codebase hiện tại. Khi có entity hoặc lớp liên quan, tôi đính kèm đường dẫn tới file trong repo.

## Tổ chức & Người dùng

- **User**: người dùng hệ thống; có `username`, `email`, `phone`, `fullName`, `status`. Gắn kết với `Position` (chức vụ hiện tại) và có thể liên kết tới nhiều `Department` qua `UserDepartment`. Xem: [src/main/java/vn/acme/paperless_meeting/entity/User.java](src/main/java/vn/acme/paperless_meeting/entity/User.java).

- **Department**: đơn vị/phòng ban; có `deptName` và hỗ trợ cấu trúc phân cấp (`parentDepartment`). Chứa nhiều `Position` (chức vụ nghiệp vụ). Xem: [src/main/java/vn/acme/paperless_meeting/entity/Department.java](src/main/java/vn/acme/paperless_meeting/entity/Department.java).

- **Position**: chức vụ/vị trí nghiệp vụ của user trong phòng ban (ví dụ: Trưởng phòng, Phó phòng, Nhân viên). Khoá ngoài: `department_id`. Fields: `positionName`, `positionCode`, `rankOrder`, `isLeadership`, `description`. **Ghi chú: khác biệt hoàn toàn với `Role` (phân quyền hệ thống) và `MeetingParticipant.participantRole` (vai trò trong cuộc họp).** Xem: [src/main/java/vn/acme/paperless_meeting/entity/Position.java](src/main/java/vn/acme/paperless_meeting/entity/Position.java).

- **UserDepartment**: mapping `User` ↔ `Department`; cho phép một user gắn kết tới nhiều phòng ban. Có `isPrimary` (phòng ban chính) và `endDate` (ngày kết thúc liên kết nếu có). Xem: [src/main/java/vn/acme/paperless_meeting/entity/UserDepartment.java](src/main/java/vn/acme/paperless_meeting/entity/UserDepartment.java).

## Họp họp & Tham dự

- **Meeting**: thực thể cuộc họp, biểu diễn bằng `Meeting` entity. Thông tin chính: `title`, `start_time`, `end_time`, `status`, `location_id`. Xem: [src/main/java/vn/acme/paperless_meeting/entity/Meeting.java](src/main/java/vn/acme/paperless_meeting/entity/Meeting.java).

- **AgendaItem**: mục chương trình của một cuộc họp; có `order_no`, `duration_est`, `owner_user_id`. Xem: [src/main/java/vn/acme/paperless_meeting/entity/AgendaItem.java](src/main/java/vn/acme/paperless_meeting/entity/AgendaItem.java).

- **Minutes**: biên bản cuộc họp; lưu `content`, `version_no`, `status` (`draft`, `submitted`, `approved`, `published`). Xem: [src/main/java/vn/acme/paperless_meeting/entity/Minutes.java](src/main/java/vn/acme/paperless_meeting/entity/Minutes.java).

- **MeetingParticipant**: mapping `User` ↔ `Meeting` gồm `participant_role` (vai trò **TRONG CỤC HỌP**: chair, secretary, member, guest), `invite_status`, `attendance_status`. **Ghi chú: `participantRole` là vai trò tạm thời trong một cuộc họp cụ thể, khác hoàn toàn với `Position` (chức vụ công việc của user trong phòng ban).** Xem: [src/main/java/vn/acme/paperless_meeting/entity/MeetingParticipant.java](src/main/java/vn/acme/paperless_meeting/entity/MeetingParticipant.java).

## Tài liệu

- **MeetingInvitation**: lời mời tham gia cuộc họp, có `rsvp_deadline`.

- **AttendanceLog**: bản ghi check-in/check-out của user cho meeting; ghi `method` (qr, gps, manual...), `late_minutes`.

- **Document**: tài liệu chung (file metadata); liên quan `DocumentVersion` cho phiên bản.

- **DocumentVersion**: phiên bản cụ thể của `Document` (binary hoặc metadata versioning).

- **DocTemplate**: template để sinh tài liệu (field mapping → `GeneratedDocument`).

- **GeneratedDocument**: tài liệu được tạo ra từ `DocTemplate` và `params_json`.

## Phê duyệt (Approval)

- **ApprovalRequest**: yêu cầu phê duyệt cho một tài nguyên (ví dụ: `DOCUMENT`, `MINUTES`).

- **ApprovalStep**: bước trong quy trình phê duyệt (người duyệt, quyết định, comment).

## Vote & Động thái (Motions)

- **Motion**: một đề xuất/kiến nghị trong cuộc họp, có thể dẫn tới `VoteSession`.

- **VoteSession**: phiên bỏ phiếu liên quan tới `Motion`; có cấu hình `vote_type`, `is_anonymous`, `allow_change_vote`, `pass_rule`.

- **VoteBallot**: lá phiếu của user trong một `VoteSession` (1 lá / 1 user / 1 session).

- **VoteResult**: tóm tắt kết quả một `VoteSession` (tổng eligible, tổng cast, passed boolean).

## Khác

- **SpeakerQueue / SpeakerTurn**: quản lý danh sách và lượt phát biểu trong cuộc họp.

## Phân quyền & Kiểm soát truy cập

- **Role**: vai trò **hệ thống** dùng để cấp quyền hành động (ví dụ: Admin, Editor, Viewer). **Ghi chú: `Role` là để phân quyền (access control), khác hoàn toàn với `Position` (chức vụ công việc).** Xem: [src/main/java/vn/acme/paperless_meeting/entity/Role.java](src/main/java/vn/acme/paperless_meeting/entity/Role.java).

- **Permission**: quyền hành động hệ thống (ví dụ: VIEW, EDIT, APPROVE, DELETE). Được gán tới `Role` thông qua `RolePermission`. Xem: [src/main/java/vn/acme/paperless_meeting/entity/Permission.java](src/main/java/vn/acme/paperless_meeting/entity/Permission.java).

- **RolePermission**: mapping `Role` ↔ `Permission`; xác định quyền nào được gán cho role nào.

- **UserRoleScope**: gán `Role` cho `User` trong một `Scope` cụ thể; ghi nhận người gán (`assignedBy`) và thời gian gán. Xem: [src/main/java/vn/acme/paperless_meeting/entity/UserRoleScope.java](src/main/java/vn/acme/paperless_meeting/entity/UserRoleScope.java).

- **Scope**: phạm vi áp dụng role assignment — SYSTEM (toàn hệ thống), DEPARTMENT (cấp phòng ban), hoặc MEETING (cấp cuộc họp cụ thể). Cho phép role được gán linh hoạt ở các mức khác nhau.

- **AclPrincipal**: đại diện cho principal (user/role/department) dùng trong ACL (Access Control List).

- **AclEntry**: bản ghi cấp quyền trên resource cụ thể (resource_type, resource_id, permission_code, principal). Chi tiết hơn `UserRoleScope` — áp dụng quyền trực tiếp trên tài nguyên.

## Cơ chế corebase

- **SoftDeletable**: base entity pattern áp dụng soft-delete (khoá `soft_deleted` thay vì xoá cứng).

- ApiResponse: envelope chuẩn cho mọi response (fields: `success`, `code`, `message`, `data`). Xem: [src/main/java/vn/acme/paperless_meeting/dto/base/ApiResponse.java](src/main/java/vn/acme/paperless_meeting/dto/base/ApiResponse.java).

- AppException: exception nghiệp vụ tiêu chuẩn trong dự án; dùng `ErrorCode` để biểu diễn lỗi. Xem: [src/main/java/vn/acme/paperless_meeting/exceptions/AppException.java](src/main/java/vn/acme/paperless_meeting/exceptions/AppException.java).

- ErrorCode: enum mã lỗi dùng trong `AppException` → mapping tới HTTP status trong `GlobalExceptionHandler`.

- RefreshToken: entity lưu refresh token cho flow JWT rotate/refresh.

- JwtTokenGenerator / JwtTokenVerifier: lớp xử lý tạo và verify token JWT (xem `service/auth`).

---
Ghi chú: nếu cần mở rộng glossary (thêm ví dụ JSON, luồng trạng thái chi tiết), tôi sẽ bổ sung theo yêu cầu sản phẩm.
