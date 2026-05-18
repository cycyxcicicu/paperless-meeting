# Current Backend Snapshot

*Tài liệu này lưu trữ ảnh chụp (snapshot) của backend hiện tại để làm base context cho các AI và developer tham gia vào project. Mọi thông tin ở đây được quét trực tiếp từ mã nguồn thực tế.*

## 1. Tổng quan hệ thống
- **Tech Stack**: Java 21, Spring Boot 4.0.3, Hibernate (Spring Data JPA), Spring Security.
- **Authentication**: JWT (phiên bản `io.jsonwebtoken` 0.13.0), MapStruct cho DTO mapping, Lombok.
- **Database**: MySQL.
- **Kiến trúc**: Layered Architecture (`Controller` -> `Service` -> `Repository`). Có sử dụng `GlobalExceptionHandler`, `ApiResponse` wrapper, DTOs (Request/Response separation), và `SoftDeletable` pattern (có filter `is_deleted = false`).

## 2. Các module hiện tại (đã phân tích code)

| Module | Tình trạng | Controller | Ghi chú |
|---|---|---|---|
| **Auth** | Đã có | `AuthController` | Login, Refresh Token, Logout, me, change password. |
| **User** | Đã có | `UserCrudController` | CRUD cơ bản. |
| **Department** | Đã có | `DepartmentController`| Hỗ trợ phân cấp cha/con. |
| **Location** | Đã có | `LocationController` | Quản lý địa điểm họp. |
| **Position** | Đã có | `PositionController` | Chức danh công việc của User. |
| **Role & Permission**| Đã có | `RoleController`, `PermissionController`| RBAC cơ bản. |
| **Meeting** | Đã có | `MeetingController` | CRUD + submit/approve/reject/cancel/close + Swagger @Operation. |
| **MeetingParticipant**| Đã có | `MeetingParticipantController` | Đủ API participant, guest RSVP/public token endpoints, attendance. |
| **Agenda**| Đã có | `AgendaItemController` | CRUD + prep request + submit/approve/reject docs. |
| **Document**| Đã có | `DocumentController` | Upload file MinIO, versioning, attach/detach meeting document. |
| **Motion/Voting**| Đã có | `MotionController` | Tạo vấn đề biểu quyết, mở/đóng phiên, bỏ phiếu, thống kê. |

## 3. Các vấn đề kỹ thuật hiện tại (Known Issues)
1. **Lỗi `ApiResponse` Builder**: Lớp `ApiResponse` có tham số `success` và `code` là kiểu `int`. Tuy nhiên khi sử dụng Builder mặc định mà không set giá trị, nó sẽ rơi vào `success: false` và `code: 0`. Lỗi này đang hiển hiện ở `MeetingController`. Helper `ApiResponse.success(T)` bị hardcode giá trị `67` cần được điều chỉnh.
2. **Missing Auditing**: Entity kế thừa `SoftDeletable` đã lo phần xóa mềm, nhưng `createdAt`, `createdBy`, `updatedAt` lại đang khai báo thủ công phân tán ở các entity (ví dụ `Meeting` tự có `@CreationTimestamp`). Việc hợp nhất vào một Base Entity sẽ tốt hơn nhưng hiện tại theo nguyên tắc "không refactor" thì vẫn giữ nguyên.
3. **Hiệu năng Sub-department query**: Tại `MeetingService.findAll()`, việc lấy toàn bộ danh sách `subDeptIds` và push vào truy vấn SQL `IN(...)` có nguy cơ chậm khi tổ chức lớn.

## 4. Open Questions (Các quyết định mở)
- Cần tách approval khỏi `MeetingService` thành `ApprovalService` chung (multi-resource) hay giữ MVP hiện tại?
- Có triển khai Plan 7 Notification ngay trong sprint kế tiếp không?
- Có cần bổ sung `@PreAuthorize` chi tiết cho từng endpoint nhạy cảm để hardening production?
