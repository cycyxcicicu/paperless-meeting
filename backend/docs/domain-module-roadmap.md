# Domain Module Roadmap — Chi tiết Plan 0→9

*Nguồn: Source code thực tế. Mỗi Plan có 3 phương án A/B/C và đề xuất.*

---

## Plan 0: Fix bug cơ sở

**Mục tiêu**: Sửa lỗi `ApiResponse` Builder để FE nhận đúng response.

**API cần sửa**: 9 endpoint trong MeetingController (thêm `.success(true).code(200)`).
**Entity/DTO**: Không đổi. **Database**: Không đổi.
**Validation**: Không thay đổi logic. **Permission**: Không thay đổi.
**Rủi ro**: Rất thấp — chỉ thêm field vào response JSON.
**Tiêu chí hoàn thành**: Tất cả API trả `success: true` khi thành công.

### Phương án A — Chỉ fix MeetingController
- **Scope**: Thêm `.success(true).code(200)` vào 9 method trong MeetingController
- **Không làm**: Không sửa helper `ApiResponse.success()`
- **Ưu điểm**: Nhanh (~15 phút), không ảnh hưởng module khác
- **Nhược điểm**: Helper vẫn bị lỗi, dev mới có thể dùng nhầm
- **Khi nào chọn**: Cần ghép FE ngay lập tức

### Phương án B — Fix MeetingController + sửa helper
- **Scope**: Fix 9 method + sửa `ApiResponse.success(T data)` đổi code `67→200`
- **Ưu điểm**: Helper an toàn cho tương lai
- **Nhược điểm**: Cần kiểm tra xem có nơi nào dùng helper không
- **Khi nào chọn**: Có thêm 15 phút để kiểm tra

### Phương án C — Fix + thêm convenience methods
- **Scope**: Như B + thêm `ApiResponse.ok(T data, String message)` tiện dụng
- **Ưu điểm**: Developer experience tốt hơn
- **Nhược điểm**: Thay đổi lớp base, ảnh hưởng convention
- **Khi nào chọn**: Refactor chung toàn bộ response format

**👉 Đề xuất: Phương án B** — Sửa cả helper lẫn controller, an toàn và nhanh.

---

## Plan 1: Foundation — Auth/User/Role/Permission

**Mục tiêu**: Đảm bảo module nền tảng hoạt động hoàn chỉnh cho FE quản trị.

**API hiện có**: 34 endpoint đã implement, đã set `success(true)` đúng.
**Entity/DTO**: Đã đầy đủ. **Database**: Không đổi.
**Rủi ro**: Thấp — module đã chạy ổn.
**Tiêu chí hoàn thành**: FE ghép được login, quản lý user, quản lý role/permission.

### Phương án A — Giữ nguyên, chỉ test
- **Scope**: Không code thêm, chỉ verify 34 API hoạt động đúng qua Swagger
- **Khi nào chọn**: FE đã ghép được login + user management

### Phương án B — Bổ sung API phụ trợ
- **Scope**: Thêm `GET /users/me/permissions` (list quyền user hiện tại), `PUT /users/{id}/status` (active/inactive user)
- **Khi nào chọn**: FE cần kiểm tra quyền dynamic trên client

### Phương án C — Bổ sung + phân quyền annotation
- **Scope**: Như B + thêm `@PreAuthorize` annotation trên tất cả controller
- **Khi nào chọn**: Cần bảo mật chặt cho production

**👉 Đề xuất: Phương án A** — Module đã đủ, tập trung vào Meeting trước.

---

## Plan 2: Meeting Basic APIs

**Mục tiêu**: Fix bug + bổ sung DELETE meeting. FE ghép được CRUD cuộc họp.

**API cần làm**:
| Method | Endpoint | Chức năng | Cần tạo mới |
|---|---|---|---|
| DELETE | /meetings/{id} | Xóa cuộc họp (soft delete, chỉ DRAFT/CANCELLED) | Controller method |

**Entity/DTO**: Không đổi. **Database**: Không đổi.
**Validation**: Chỉ xóa khi DRAFT hoặc CANCELLED, phải có quyền edit.
**Permission**: Dùng `requireEditPermission()` đã có trong MeetingService.
**Tiêu chí hoàn thành**: CRUD meeting hoạt động, response trả đúng format.

### Phương án A — Chỉ fix bug (không thêm DELETE)
- **Scope**: Fix 9 endpoint response format
- **Khi nào chọn**: FE chưa cần xóa meeting

### Phương án B — Fix bug + thêm DELETE
- **Scope**: Fix response + 1 endpoint DELETE mới
- **Khi nào chọn**: FE cần đủ CRUD (khuyến nghị)

### Phương án C — Như B + enrich MeetingResponse
- **Scope**: Thêm `participantCount`, `agendaItemCount` vào MeetingResponse
- **Khi nào chọn**: FE cần hiển thị thông tin tổng hợp trên danh sách

**👉 Đề xuất: Phương án B** — Có DELETE là đủ CRUD.

---

## Plan 3: Meeting Participant APIs

**Mục tiêu**: FE quản lý được người tham dự cuộc họp.

**API cần làm**:
| Method | Endpoint | Request DTO | Cần tạo mới |
|---|---|---|---|
| GET | /meetings/{id}/participants | — | Controller, Service, Mapper |
| POST | /meetings/{id}/participants | AddParticipantRequest (✅ có) | Service logic |
| DELETE | /meetings/{id}/participants/{userId} | — | Service logic |
| PUT | /meetings/{id}/participants/{userId}/role | UpdateParticipantRoleRequest (✅ có) | Service logic |
| PUT | /meetings/{id}/participants/{userId}/invite-status | UpdateInviteStatusRequest (✅ có) | Service logic |

**Entity/DTO có sẵn**: `MeetingParticipant`, `AddParticipantRequest`, `UpdateParticipantRoleRequest`, `UpdateInviteStatusRequest`, `UpdateAttendanceStatusRequest`, `ParticipantResponse`, `MeetingParticipantRepository` (5 query methods).
**ErrorCode có sẵn**: 10 mã lỗi participant (1229–1239).
**Cần tạo mới**: `MeetingParticipantMapper`, `MeetingParticipantService`, `MeetingParticipantController`.
**Database**: Không đổi. **Validation**: Dùng ErrorCode sẵn có.
**Tiêu chí hoàn thành**: Thêm/xóa/sửa role/RSVP người tham dự qua API.

### Phương án A — MVP 5 endpoint
- **Scope**: 5 API cơ bản như trên
- **Không làm**: Batch add, attendance tracking
- **Khi nào chọn**: Ghép FE nhanh trong ngày

### Phương án B — Như A + batch add + attendance
- **Scope**: Thêm `POST /meetings/{id}/participants/batch`, `PUT .../attendance-status`
- **Khi nào chọn**: FE cần mời nhiều người cùng lúc

### Phương án C — Như B + conflict check + email notification
- **Scope**: Check xung đột lịch họp user, gửi email mời
- **Khi nào chọn**: Production-ready

**👉 Đề xuất: Phương án A** — DTO/Repo đã sẵn, 3 giờ là xong.

---

## Plan 4: Agenda Item APIs

**Mục tiêu**: FE quản lý chương trình nghị sự cuộc họp.

**API cần làm**:
| Method | Endpoint | Cần tạo mới |
|---|---|---|
| GET | /meetings/{id}/agenda-items | DTO, Mapper, Service, Controller |
| POST | /meetings/{id}/agenda-items | AgendaItemUpsertRequest, Service |
| PUT | /meetings/{id}/agenda-items/{agendaId} | Service |
| DELETE | /meetings/{id}/agenda-items/{agendaId} | Service |
| PUT | /meetings/{id}/agenda-items/reorder | ReorderRequest DTO |

**Entity có sẵn**: `AgendaItem` (đầy đủ fields). **Repository**: Cần thêm query methods.
**Cần tạo mới**: `AgendaItemUpsertRequest`, `AgendaItemResponse`, `AgendaItemMapper`, `AgendaItemService`, `AgendaItemController`, `ReorderRequest`.
**Database**: Không đổi.
**Tiêu chí hoàn thành**: CRUD + reorder agenda trong draft meeting.

### Phương án A — CRUD cơ bản (không reorder)
- **Scope**: 4 endpoint CRUD
- **Khi nào chọn**: FE chưa cần drag-drop sắp xếp

### Phương án B — CRUD + reorder
- **Scope**: 5 endpoint bao gồm reorder
- **Khi nào chọn**: FE cần đầy đủ UX (khuyến nghị)

### Phương án C — Như B + gán owner + status tracking
- **Scope**: Quản lý `ownerUser`, chuyển status PENDING→IN_PROGRESS→DONE
- **Khi nào chọn**: Điều hành cuộc họp real-time

**👉 Đề xuất: Phương án B** — Reorder là tính năng quan trọng cho agenda.

---

## Plan 5: Meeting Document/File APIs

**Mục tiêu**: Gắn tài liệu vào cuộc họp.

**Entity có sẵn**: `Document`, `DocumentVersion`, `MeetingDocument`.
**Cần tạo mới**: Toàn bộ DTO, Mapper, Service, Controller, FileStorageService.
**Database**: Không đổi entity. Cần quyết định storage (local/S3/MinIO).

### Phương án A — Metadata only (không upload file)
- **Scope**: CRUD `MeetingDocument` chỉ lưu metadata (title, URL bên ngoài)
- **Khi nào chọn**: Chưa có infra file storage

### Phương án B — Upload file lên local disk
- **Scope**: Như A + `POST /documents/upload` lưu file local, trả fileUrl
- **Khi nào chọn**: Dev/staging environment

### Phương án C — Upload S3/MinIO + versioning
- **Scope**: Full versioning qua `DocumentVersion`, presigned URL
- **Khi nào chọn**: Production-ready

**👉 Đề xuất: Phương án A** cho tuần này, **Phương án B** khi cần demo.

---

## Plan 6: Approval Workflow (submit/approve/reject)

**Mục tiêu**: Meeting approval đã hoạt động. Mở rộng cho Document/Minutes nếu cần.

**Hiện trạng**: Meeting approval đã code cứng trong `MeetingService` (approve/reject/submit). Entity `ApprovalRequest` + `ApprovalStep` đã có nhưng chưa được sử dụng.

### Phương án A — Giữ nguyên (approval cho Meeting đã đủ)
- **Khi nào chọn**: Chỉ cần approve Meeting

### Phương án B — Dùng ApprovalRequest entity cho multi-resource
- **Scope**: Tạo ApprovalService xử lý approve cho Meeting, Document, Minutes
- **Khi nào chọn**: Cần approval workflow cho tài liệu

### Phương án C — Multi-step approval chain
- **Scope**: Dùng ApprovalStep cho chuỗi phê duyệt nhiều bước
- **Khi nào chọn**: Enterprise workflow

**👉 Đề xuất: Phương án A** — Meeting approval đã hoạt động, không cần phức tạp hóa.

---

## Plan 7: Notification/Reminder

**Entity có sẵn**: `Notification` (type, content, channel, status, scheduledAt, sentAt, readAt, refType, refId).
**Hiện trạng**: Chỉ có entity, chưa có API hay service nào.

### Phương án A — In-app notification (đọc/đánh dấu đã đọc)
- **API**: GET /notifications, PUT /notifications/{id}/read, PUT /notifications/read-all
- **Khi nào chọn**: FE có notification bell

### Phương án B — Như A + auto-generate khi approve/reject/invite
- **Scope**: Tạo notification tự động trong MeetingService/ParticipantService
- **Khi nào chọn**: UX hoàn chỉnh

### Phương án C — Như B + email/WebSocket push
- **Khi nào chọn**: Real-time notification

**👉 Đề xuất: Phương án A** trước, **B** khi cần UX tốt hơn.

---

## Plan 8: Audit Log

**Entity có sẵn**: `AuditLog` (action, resourceType, resourceId, metaJson, actorUser, retentionUntil).
**Hiện trạng**: Chỉ có entity.

### Phương án A — Không làm (chưa cần)
- **Khi nào chọn**: Chưa có yêu cầu compliance

### Phương án B — Ghi log tự động qua AOP/Event
- **Scope**: Tạo `@Auditable` annotation, tự động ghi AuditLog cho các action quan trọng
- **Khi nào chọn**: Cần truy vết hành động user

### Phương án C — Như B + dashboard xem audit log
- **Scope**: API GET /audit-logs + filter
- **Khi nào chọn**: Admin cần xem lịch sử

**👉 Đề xuất: Phương án A** — Chưa cần cho đợt này.

---

## Plan 9: Frontend Integration + Test Data + Swagger

**Mục tiêu**: FE có đủ dữ liệu mẫu và tài liệu API để ghép.

### Phương án A — Swagger UI + sample data seed
- **Scope**: Kiểm tra Swagger UI hoạt động, cập nhật `SampleDataInitializer`
- **Khi nào chọn**: FE dev dùng Swagger

### Phương án B — Như A + Postman collection export
- **Khi nào chọn**: FE cần test offline

### Phương án C — Như B + API versioning
- **Khi nào chọn**: Multiple FE consumers

**👉 Đề xuất: Phương án A** — Swagger UI đã có sẵn.

---

## Tóm tắt thứ tự ưu tiên

| Thứ tự | Plan | Ước lượng | Phương án đề xuất | Lý do |
|---|---|---|---|---|
| 1 | Plan 0 (Fix ApiResponse) | 30 phút | B | Bug blocking FE |
| 2 | Plan 3 (Participant) | 3 giờ | A | DTO/Repo sẵn, FE cần nhất |
| 3 | Plan 2 (Meeting DELETE) | 30 phút | B | Hoàn thiện CRUD |
| 4 | Plan 4 (Agenda) | 3 giờ | B | FE cần cho tạo cuộc họp |
| 5 | Plan 5 (Document) | 4 giờ | A | Metadata trước |
| 6 | Plan 1 (Foundation) | 0 | A | Đã đủ |
| 7 | Plan 7 (Notification) | 2 giờ | A | Nice-to-have |
| 8 | Plan 6 (Approval) | 0 | A | Đã đủ |
| 9 | Plan 8 (Audit) | 0 | A | Chưa cần |
| 10 | Plan 9 (Integration) | 1 giờ | A | Song song |

**Tổng ước lượng cho FE ghép tuần này: ~10 giờ** (Plan 0 + 2 + 3 + 4).
