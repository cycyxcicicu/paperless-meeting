# Frontend Integration Contract

*Mapping giữa màn hình FE và API BE. Nguồn: source code thực tế.*

---

## 1. Login / Current User

| Màn hình | API | Method | Endpoint | Request | Response | Ghi chú |
|---|---|---|---|---|---|---|
| Form đăng nhập | Login | POST | /auth/login | `LoginRequest` {username, password} | Void (token set vào httpOnly cookie) | FE không nhận token trong body |
| Kiểm tra phiên | Refresh token | POST | /auth/refresh | — (cookie tự gửi) | Void (cookie mới) | Gọi khi access token hết hạn |
| Lấy user hiện tại | Get me | GET | /auth/me | — | `UserResponse` {id, username, fullName, email, role...} | Gọi sau login để hiển thị header |
| Đăng xuất | Logout | POST | /auth/logout | — (cookie) | Void | Xóa cookie |
| Đổi mật khẩu | Change password | POST | /auth/change-password | `ChangePasswordRequest` {oldPassword, newPassword} | Void | isFirstLogin=true → buộc đổi |

---

## 2. Danh sách cuộc họp

| Màn hình | API | Method | Endpoint | Request | Response | Ghi chú |
|---|---|---|---|---|---|---|
| Bảng danh sách | Lấy danh sách | GET | /meetings | `?keyword=&status=&fromDate=&toDate=&page=0&size=10&sort=createdAt,desc` | `PageResponse<MeetingResponse>` | ⚠️ Hiện trả `success:false` (Plan 0 fix) |
| Filter theo status | — | — | — | `?status=DRAFT` hoặc `UPCOMING`, `IN_PROGRESS`... | — | Dùng enum MeetingStatus |
| Filter theo ngày | — | — | — | `?fromDate=2026-05-01T00:00:00&toDate=2026-05-31T23:59:59` | — | ISO 8601 format |

**MeetingResponse fields**: id, title, status, startTime, endTime, checkinOpenAt, checkinCloseAt, lateAfterMinutes, createdAt, cancelReason, locationId, locationName, departmentId, departmentName, createdById, createdByName, approvedById, approvedByName, approvedAt, rejectReason

---

## 3. Tạo / Sửa cuộc họp

| Màn hình | API | Method | Endpoint | Request | Response | Ghi chú |
|---|---|---|---|---|---|---|
| Form tạo mới | Tạo meeting | POST | /meetings | `MeetingUpsertRequest` {title*, departmentId*, startTime, endTime, checkinOpenAt, checkinCloseAt, lateAfterMinutes, locationId} | `MeetingResponse` | Status mặc định = DRAFT |
| Form sửa | Cập nhật meeting | PUT | /meetings/{id} | `MeetingUpsertRequest` (same) | `MeetingResponse` | Chỉ cho phép khi DRAFT hoặc REJECTED |
| Dropdown phòng ban | Lấy departments | GET | /departments | — | `List<DepartmentResponse>` | Để chọn departmentId |
| Dropdown địa điểm | Lấy locations | GET | /locations | `?departmentId=xxx` | `PageResponse<LocationResponse>` | Filter theo phòng ban |
| Xóa cuộc họp | Xóa (soft) | DELETE | /meetings/{id} | — | Void | **🆕 Plan 2** — Chỉ DRAFT/CANCELLED |

---

## 4. Chi tiết cuộc họp

| Màn hình | API | Method | Endpoint | Request | Response | Ghi chú |
|---|---|---|---|---|---|---|
| Thông tin chung | Chi tiết meeting | GET | /meetings/{id} | — | `MeetingResponse` | Hiển thị title, status, thời gian, phòng, người tạo |
| Tab Tham dự | Danh sách participant | GET | /meetings/{id}/participants | — | `List<ParticipantResponse>` | **🆕 Plan 3** |
| Tab Chương trình | Danh sách agenda | GET | /meetings/{id}/agenda-items | — | `List<AgendaItemResponse>` | **🆕 Plan 4** |
| Tab Tài liệu | Danh sách tài liệu | GET | /meetings/{id}/documents | — | `List<MeetingDocumentResponse>` | **🆕 Plan 5** |

---

## 5. Thành phần tham dự (Plan 3)

| Màn hình | API | Method | Endpoint | Request | Response | Ghi chú |
|---|---|---|---|---|---|---|
| Danh sách | Lấy participants | GET | /meetings/{id}/participants | — | `List<ParticipantResponse>` | 🆕 |
| Thêm người | Thêm participant | POST | /meetings/{id}/participants | `AddParticipantRequest` {userId*, participantRole*, inviteStatus, attendanceStatus, note} | `ParticipantResponse` | 🆕 Check duplicate |
| Xóa người | Xóa participant | DELETE | /meetings/{id}/participants/{userId} | — | Void | 🆕 Soft delete |
| Đổi vai trò | Update role | PUT | /meetings/{id}/participants/{userId}/role | `UpdateParticipantRoleRequest` {participantRole*} | `ParticipantResponse` | 🆕 CHAIR/SECRETARY/PARTICIPANT |
| Phản hồi mời | Update invite status | PUT | /meetings/{id}/participants/{userId}/invite-status | `UpdateInviteStatusRequest` {inviteStatus*} | `ParticipantResponse` | 🆕 PENDING/ACCEPTED/DECLINED |
| Dropdown users | Tìm users | GET | /users | `?keyword=&departmentId=&page=0&size=20` | `PageResponse<UserResponse>` | API đã có — dùng để search user thêm vào |

**ParticipantResponse fields**: meetingId, userId, username, fullName, participantRole, inviteStatus, attendanceStatus, note, createdAt, updatedAt

---

## 6. Gửi duyệt / Duyệt / Từ chối

| Màn hình | API | Method | Endpoint | Request | Response | Ghi chú |
|---|---|---|---|---|---|---|
| Nút "Gửi duyệt" | Submit approval | POST | /meetings/{id}/submit-approval | — | Void | DRAFT/REJECTED → PENDING_APPROVAL |
| Nút "Duyệt" | Approve | POST | /meetings/{id}/approve | — | Void | PENDING_APPROVAL → UPCOMING |
| Nút "Từ chối" | Reject | POST | /meetings/{id}/reject | `?rejectReason=...` (query param) | Void | PENDING_APPROVAL → REJECTED |
| Nút "Hủy" | Cancel | POST | /meetings/{id}/cancel | `?cancelReason=...` (query param) | Void | UPCOMING/PENDING_APPROVAL → CANCELLED |
| Nút "Kết thúc" | Close | POST | /meetings/{id}/close | — | Void | IN_PROGRESS → CLOSED |

**Lưu ý**: `rejectReason` và `cancelReason` hiện đang nhận qua **query param** (`@RequestParam`), không phải request body.

---

## 7. Quản lý người dùng

| Màn hình | API | Method | Endpoint | Request | Response | Ghi chú |
|---|---|---|---|---|---|---|
| Danh sách users | Lấy danh sách | GET | /users | `?keyword=&status=&role=&departmentId=&page=0&size=10` | `PageResponse<UserResponse>` | Đã có |
| Chi tiết user | Lấy chi tiết | GET | /users/{id} | — | `UserResponse` | Đã có |
| Tạo user | Tạo mới | POST | /users/register | `UserCreateRequest` | `UserResponse` | Đã có |
| Sửa user | Cập nhật | PUT | /users/{id} | `UserUpdateRequest` | `UserResponse` | Đã có |
| Xóa user | Xóa (soft) | DELETE | /users/{id} | — | Void | Đã có |

---

## 8. Quản lý vai trò / quyền

| Màn hình | API | Method | Endpoint | Request | Response | Ghi chú |
|---|---|---|---|---|---|---|
| Danh sách roles | Lấy roles | GET | /roles | — | `List<RoleResponse>` | Đã có |
| CRUD role | Tạo/sửa/xóa | POST/PUT/DELETE | /roles, /roles/{id} | `RoleUpsertRequest` | `RoleResponse` | Đã có |
| Danh sách permissions | Lấy permissions | GET | /permissions | — | `List<PermissionResponse>` | Đã có |
| CRUD permission | Tạo/sửa/xóa | POST/PUT/DELETE | /permissions, /permissions/{id} | `PermissionUpsertRequest` | `PermissionResponse` | Đã có |

---

## 9. Tóm tắt trạng thái API cho FE

| Màn hình | Tổng API cần | Đã có | Cần làm mới | Plan |
|---|---|---|---|---|
| Login / Auth | 5 | 5 | 0 | — |
| Danh sách cuộc họp | 1 | 1 (bug) | fix | Plan 0 |
| Tạo/sửa cuộc họp | 4 | 3 (bug) | 1 (DELETE) | Plan 0+2 |
| Chi tiết cuộc họp | 4 | 1 (bug) | 3 | Plan 3+4+5 |
| Thành phần tham dự | 6 | 1 (GET users) | 5 | Plan 3 |
| Gửi duyệt / Duyệt | 5 | 5 (bug) | fix | Plan 0 |
| Quản lý user | 5 | 5 | 0 | — |
| Quản lý role/permission | 10 | 10 | 0 | — |
| **Tổng** | **40** | **31** | **9 mới + 9 fix** | |

**Kết luận**: FE cần **9 API mới** (Plan 2+3+4) và **9 API fix bug** (Plan 0) để ghép được toàn bộ module Meeting cơ bản. Tổng ước lượng: ~10 giờ.
