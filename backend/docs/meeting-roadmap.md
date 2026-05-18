# Meeting Module Roadmap (v2)

*Cập nhật 2026-05-19. Đồng bộ với `domain-module-roadmap.md`.*

> File này chỉ tập trung vào module Meeting. Xem `domain-module-roadmap.md` cho toàn bộ dự án.

## Trạng thái hiện tại

- **Meeting CRUD + workflow**: ✅ Hoàn thành
- **MeetingStatusJob**: ✅ Cron tự động UPCOMING → IN_PROGRESS
- **Participant API**: ✅ Hoàn thành (bao gồm guest/public RSVP flow)
- **Agenda API**: ✅ Hoàn thành
- **Document API**: ✅ Hoàn thành (MinIO upload + versioning + attach)
- **Motion/Vote API**: ✅ Hoàn thành
- **Swagger/OpenAPI cho Meeting stack**: ✅ Hoàn thành

## Việc còn lại cho module Meeting (nâng cao)

1. **Security hardening**: bổ sung `@PreAuthorize` chi tiết cho endpoint nhạy cảm
2. **Integration test**: test thực DB + MinIO/Testcontainers cho các flow chính
3. **Notification hooks**: phát sinh thông báo khi mời họp, submit/approve/reject
4. **Audit trail**: ghi nhận hành động quan trọng (approve/reject/vote/document actions)

**Kết luận**: Module Meeting core đã sẵn sàng cho frontend tích hợp end-to-end.
