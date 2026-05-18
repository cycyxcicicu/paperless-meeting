# Domain Module Roadmap — Chi tiết Plan 0→9

*Nguồn: Source code thực tế. Mỗi Plan có 3 phương án A/B/C và đề xuất.*

---

## Tổng quan tiến độ hiện tại

**Cập nhật lần cuối**: 2026-05-19 03:26

**Tiến độ backend ước tính**: **~72% hoàn thành**.

Core nghiệp vụ chính đã hoàn thiện đủ để frontend bắt đầu tích hợp:

- Auth / User / Role / Permission đã có nền tảng đầy đủ.
- Meeting CRUD và workflow submit / approve / reject / cancel / close đã hoạt động.
- Participant / guest RSVP / attendance đã có API và public token flow.
- Agenda Item đã có CRUD, quy trình chuẩn bị tài liệu, duyệt / từ chối tài liệu.
- Motion & Vote đã có API tạo biểu quyết, mở / đóng phiên, bỏ phiếu và thống kê.
- Document API đã tích hợp MinIO, upload file, versioning và attach vào meeting.
- Swagger/OpenAPI annotation đã bổ sung cho các controller chính.
- Unit test hiện đã chạy thành công, gần nhất ghi nhận **68/68 tests passed**.

Các phần còn thiếu chủ yếu là module hỗ trợ vận hành:

- Notification / Reminder.
- Audit Log.
- Seed data đầy đủ cho frontend test.
- Security annotation chi tiết theo permission (`@PreAuthorize`) nếu cần production hardening.

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

## Plan 7: Notification/Reminder (chi tiết triển khai WebSocket + Email Cloud)

**Mục tiêu**:
1. Có **in-app notification** cho người dùng (notification bell).
2. Có **real-time push** qua **WebSocket** khi có sự kiện mới.
3. Có **email notification/reminder** qua dịch vụ cloud (fallback khi user offline).
4. Theo dõi được trạng thái gửi (`PENDING` → `SENT` / `FAILED`) để retry.

**Entity có sẵn**: `Notification` (type, content, channel, status, scheduledAt, sentAt, readAt, refType, refId).

### 7.1 Phạm vi nghiệp vụ (events cần bắn thông báo)

**Bắt buộc (phase đầu):**
- Meeting: `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED`, `PUBLISHED`, `CLOSED`.
- Participant: `INVITED`, `RSVP_ACCEPTED`, `RSVP_DECLINED`.
- Agenda: `PREP_REQUESTED`, `DOCS_SUBMITTED`, `DOCS_APPROVED`, `DOCS_REJECTED`.
- Motion: `VOTE_STARTED`, `VOTE_ENDED`.

**Reminder jobs:**
- Nhắc lịch họp trước 24h, 2h, 15 phút (configurable).
- Nhắc phiên biểu quyết sắp đóng (ví dụ còn 5 phút).

### 7.2 Kiến trúc kỹ thuật đề xuất

```text
Business Service (Meeting/Agenda/Participant/Motion)
        ↓ publish Domain Event
NotificationOrchestrator
        ├─ InAppNotificationService (save DB)
        ├─ WebSocketNotifier (push realtime)
        └─ EmailNotificationService (enqueue + send cloud)
                            ↓
                    Retry Scheduler / Dead-letter log
```

**Nguyên tắc:**
- Service nghiệp vụ **không gửi email trực tiếp**.
- Chỉ publish event, Notification module xử lý đa kênh.
- WebSocket gửi nhanh; Email gửi async để không block API chính.

### 7.3 Thiết kế WebSocket (Spring)

- Endpoint handshake: `/ws`.
- Dùng STOMP (`/app`, `/topic`, `/user`).
- Push theo user queue: `/user/queue/notifications`.
- Payload chuẩn:
  - `notificationId`
  - `type`
  - `title`
  - `content`
  - `refType`, `refId`
  - `createdAt`
  - `unreadCount`

**Auth WebSocket**:
- Dùng JWT token ở handshake header.
- Chỉ cho subscribe queue của chính user.

### 7.4 Email Cloud (đề xuất)

Nên implement interface:
- `EmailSenderPort`
  - `send(NotificationEmailMessage msg)`

Adapters:
- `SmtpEmailAdapter` (dev/local).
- `CloudEmailAdapter` (prod), ưu tiên 1 trong 3:

| Provider | Ưu điểm | Nhược điểm | Khuyến nghị |
|---|---|---|---|
| Brevo (Sendinblue) | Setup nhanh, API dễ dùng | Hạn mức free thấp | Tốt cho MVP/demo |
| SendGrid | Tài liệu tốt, phổ biến | Chi phí tăng theo volume | Tốt cho scale vừa |
| AWS SES | Giá rẻ khi scale lớn | Setup DNS/verified domain kỹ hơn | Tốt cho production dài hạn |

**Khuyến nghị hiện tại**: bắt đầu với **Brevo/SendGrid**, khi ổn định chuyển **SES** nếu traffic tăng.

### 7.5 API cần bổ sung

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/notifications` | Danh sách thông báo của user hiện tại (paging/filter unread) |
| GET | `/notifications/unread-count` | Số lượng chưa đọc |
| PUT | `/notifications/{id}/read` | Đánh dấu đã đọc |
| PUT | `/notifications/read-all` | Đánh dấu đọc toàn bộ |
| POST | `/notifications/test` | Test gửi notification (admin/dev only) |

### 7.6 Trạng thái & retry policy

**Status đề xuất**:
- `PENDING` (vừa tạo)
- `SENT` (push/email thành công)
- `FAILED` (gửi lỗi)
- `READ` (chỉ cho in-app)

**Retry email**:
- retry tối đa 3 lần (1m, 5m, 15m).
- quá 3 lần: giữ `FAILED`, ghi error message để theo dõi.

### 7.7 Kế hoạch triển khai theo sprint

**Phase 7A (2-3 ngày): In-app + API cơ bản**
- `NotificationService`, `NotificationController`, repository query paging.
- API list/read/read-all/unread-count.
- Tạo notification khi `approve/reject/invite`.

**Phase 7B (1-2 ngày): WebSocket realtime**
- `WebSocketConfig`, JWT handshake interceptor.
- Push event vào `/user/queue/notifications`.
- FE bell nhận realtime + cập nhật unread badge.

**Phase 7C (2 ngày): Email Cloud + Reminder scheduler**
- Implement `EmailSenderPort` + adapter cloud.
- Scheduler nhắc lịch trước họp.
- Retry policy + logging.

### 7.8 Tiêu chí hoàn thành (Definition of Done)

- User nhận được notification trên UI **ngay lập tức** khi có event.
- Reload trang vẫn thấy lịch sử notification từ DB.
- API read/read-all hoạt động, unread count chính xác.
- Email reminder gửi thành công >95% (môi trường test/staging).
- Có test cho mapper/service/retry logic và permission API.

### 7.9 Phương án A/B/C cập nhật

### Phương án A — In-app notification
- **Scope**: API list/read/read-all + lưu DB.
- **Khi nào chọn**: Cần nhanh nhất.

### Phương án B — A + auto-generate từ domain events
- **Scope**: Tự động tạo thông báo từ Meeting/Participant/Agenda/Motion.
- **Khi nào chọn**: UX hoàn chỉnh hơn.

### Phương án C — B + WebSocket + Email Cloud (khuyến nghị theo yêu cầu hiện tại)
- **Scope**: Real-time push + reminder email + retry.
- **Khi nào chọn**: Bạn cần production-ready notification.

**👉 Đề xuất: Phương án C** (theo yêu cầu dùng WebSocket và email cloud).

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

## Tóm tắt tiến độ theo Plan

| Plan | Module | Trạng thái | Tiến độ | Ghi chú |
|---|---|---:|---:|---|
| Plan 0 | Fix ApiResponse | ✅ Done | 100% | Response format đã ổn cho FE |
| Plan 1 | Foundation — Auth/User/Role/Permission | ✅ Done | 100% | Khoảng 34 endpoints nền tảng |
| Plan 2 | Meeting Basic APIs | ✅ Done | 100% | CRUD + submit/approve/reject/cancel/close |
| Plan 3 | Meeting Participant APIs | ✅ Done | 100% | Internal attendees, guests, RSVP, attendance, public token endpoints |
| Plan 4 | Agenda Item APIs | ✅ Done | 100% | CRUD + prep request + submit/approve/reject docs |
| Plan 5 | Meeting Document/File APIs | ✅ Done | 100% | MinIO upload, validation file type/size, document versioning, attach to meeting |
| Plan 6 | Approval Workflow | ✅ Done/MVP | 100% | Meeting approval đang nằm trong MeetingService; chưa tách ApprovalService riêng |
| Plan 7 | Notification/Reminder | ❌ Not started | 0% | Entity có sẵn, chưa có Service/API |
| Plan 8 | Audit Log | ❌ Not started | 0% | Entity có sẵn, chưa có Service/API |
| Plan 9 | Frontend Integration + Test Data + Swagger | ⚠️ Partial | 50% | Swagger annotation đã có; seed data/Postman collection chưa hoàn thiện |

**Tiến độ tổng thể ước tính: ~72%.**

---

## Tóm tắt endpoint hiện có

| Nhóm API | Số lượng ước tính | Ghi chú |
|---|---:|---|
| Auth | 3 | Login, refresh, logout |
| User / Role / Permission / Master data | ~31 | Nền tảng quản trị |
| Meeting | 10 | CRUD và vòng đời cuộc họp |
| Meeting Participant | 10 | Người tham dự, khách mời, RSVP, điểm danh |
| Agenda Item | 9 | Nội dung họp và quy trình chuẩn bị tài liệu |
| Motion & Vote | 8 | Biểu quyết và thống kê |
| Document | 8 | Upload MinIO, versioning, attach/detach |
| **Tổng** | **~79** | Đủ để FE tích hợp core workflow |

---

## Việc còn lại ưu tiên tiếp theo

| Ưu tiên | Hạng mục | Việc cần làm | Lý do |
|---:|---|---|---|
| 1 | Seed data | Cập nhật `SampleDataInitializer` cho meeting, participant, agenda, document, motion | FE cần dữ liệu mẫu để test nhanh |
| 2 | Notification | Tạo NotificationService + API list/read/read-all | Hoàn thiện UX thông báo |
| 3 | Security hardening | Bổ sung `@PreAuthorize` cho endpoint nhạy cảm | Chặt hơn cho production |
| 4 | Audit Log | Ghi log hành động quan trọng qua service/AOP | Phục vụ truy vết |
| 5 | Integration test | Test DB + MinIO thực tế hoặc Testcontainers | Tăng độ tin cậy triển khai |

**Kết luận hiện tại**: Backend core business đã gần hoàn thiện và có thể bàn giao frontend tích hợp. Phần còn lại tập trung vào dữ liệu mẫu, notification, audit và hardening bảo mật.
