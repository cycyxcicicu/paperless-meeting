# Meeting Module Roadmap (v2)

*Cập nhật 2026-05-14. Đồng bộ với `project-api-master-plan.md` và `domain-module-roadmap.md`.*

> File này chỉ tập trung vào module Meeting. Xem `domain-module-roadmap.md` cho toàn bộ dự án.

## Trạng thái hiện tại

- **Meeting CRUD**: ✅ Đã có (có bug ApiResponse)
- **Meeting Approval Flow**: ✅ Đã có (submit/approve/reject/cancel/close)
- **MeetingStatusJob**: ✅ Cron tự động UPCOMING → IN_PROGRESS
- **Participant API**: ❌ Thiếu Controller+Service (DTO+Repo đã sẵn)
- **Agenda API**: ❌ Thiếu Controller+Service+DTO (Entity+Repo đã có)
- **Document API**: ❌ Thiếu tất cả (Entity đã có)

## Thứ tự triển khai

1. **Plan 0**: Fix ApiResponse bug (30 phút)
2. **Plan 2**: Thêm DELETE /meetings/{id} (30 phút)
3. **Plan 3**: 5 API Participant (3 giờ) — DTO/Repo/ErrorCode sẵn
4. **Plan 4**: 5 API Agenda (3 giờ) — Cần tạo DTO mới
5. **Plan 5**: Document API (4 giờ) — Metadata only trước

Tổng: ~11 giờ cho module Meeting hoàn chỉnh cơ bản.
