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
| **Auth** | Đã có | `AuthController` | Xử lý Login, Refresh Token, Logout. Cấu trúc Cookie + CSRF. |
| **User** | Đã có | `UserCrudController` | CRUD cơ bản. Liên kết 1-N với `Department` và `Position`. |
| **Department** | Đã có | `DepartmentController`| Hỗ trợ phân cấp cha/con. |
| **Location** | Đã có | `LocationController` | Quản lý địa điểm họp. |
| **Position** | Đã có | `PositionController` | Chức danh công việc của User. |
| **Role & Permission**| Đã có | `RoleController`, `PermissionController`| RBAC cơ bản (Role gắn với nhiều Permission). |
| **Meeting** | Đã có một phần | `MeetingController` | Có CRUD, chuyển trạng thái (Approve, Cancel, Close). |
| **MeetingParticipant**| **Thiếu API** | N/A | Chỉ có Entity và DTO, chưa có Endpoint nào để gán người dùng vào cuộc họp. |
| **Tài liệu (Document)**| **Chưa hoàn thiện**| N/A | Có các Entity liên quan như `MeetingDocument`, `DocTemplate` nhưng controller chưa đầy đủ. |
| **Biểu quyết (Voting)**| **Chưa hoàn thiện**| N/A | Có entity `VoteSession`, `VoteBallot` nhưng chưa có flow điều khiển từ API. |

## 3. Các vấn đề kỹ thuật hiện tại (Known Issues)
1. **Lỗi `ApiResponse` Builder**: Lớp `ApiResponse` có tham số `success` và `code` là kiểu `int`. Tuy nhiên khi sử dụng Builder mặc định mà không set giá trị, nó sẽ rơi vào `success: false` và `code: 0`. Lỗi này đang hiển hiện ở `MeetingController`. Helper `ApiResponse.success(T)` bị hardcode giá trị `67` cần được điều chỉnh.
2. **Missing Auditing**: Entity kế thừa `SoftDeletable` đã lo phần xóa mềm, nhưng `createdAt`, `createdBy`, `updatedAt` lại đang khai báo thủ công phân tán ở các entity (ví dụ `Meeting` tự có `@CreationTimestamp`). Việc hợp nhất vào một Base Entity sẽ tốt hơn nhưng hiện tại theo nguyên tắc "không refactor" thì vẫn giữ nguyên.
3. **Hiệu năng Sub-department query**: Tại `MeetingService.findAll()`, việc lấy toàn bộ danh sách `subDeptIds` và push vào truy vấn SQL `IN(...)` có nguy cơ chậm khi tổ chức lớn.

## 4. Open Questions (Các quyết định mở chưa fix)
- Giá trị chính xác của `ApiResponse.success()` helper (cần trả HTTP 200 thay cho 67).
- Phân quyền (Permission) cho chức năng quản lý người tham dự họp (Participant): Ai có quyền thêm/bớt? (`CHAIR`, `DEPARTMENT_ADMIN` hay `CREATED_BY`).
