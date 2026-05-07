# Prompt: Sửa bug từ stacktrace

Mục đích
- Hướng dẫn bước-by-step để chuyển một Java stacktrace vào một sửa lỗi đúng quy trình: reproduce → test → fix → verify → PR.

Đầu vào
- Toàn bộ stacktrace (text). 
- (Optional) Reproducer steps hoặc sample request payload.

Quy trình chi tiết
1) Phân tích stacktrace
   - Xác định exception type và message (ví dụ `NullPointerException`, `AppException`, `DataIntegrityViolationException`).
   - Lấy top stack frame trong repo: file, class, method, line.
2) Tạo test reproduce
   - Nếu lỗi là business logic: viết unit test cho service layer.
   - Nếu lỗi xảy ra khi chạy endpoint: viết integration test (MockMvc / Testcontainers) mô phỏng yêu cầu.
   - Test phải fail trước khi sửa.
3) Tìm nguyên nhân gốc (root cause)
   - Kiểm tra code tại dòng lỗi, các biến null, preconditions, repository queries, và state transitions theo `docs/business-rules.md`.
   - Kiểm tra validation: input DTO validation, repository constraints (unique, not null).
4) Lập phương án sửa tối thiểu
   - Sửa logic (null-check, validate input, transactional boundary, query fix) theo `docs/coding-rules.md`.
   - Nếu là business error missing: ném `AppException(ErrorCode.XYZ, "message")` thay vì NPE.
5) Viết test bổ sung
   - Thêm test chứng minh bug đã được fix (unit/integration). Run và confirm pass.
6) Kiểm tra side-effects
   - Đảm bảo không làm hỏng contract API (ApiResponse), không làm leak secreto, tuân thủ security.
7) PR content
   - Giải thích root cause ngắn gọn.
   - Đính kèm stacktrace gốc, test failing → passing, file patches.

Tips & checks
- Không sửa bằng cách catch-all `Exception` hoặc swallow error. Thay vào đó ném `AppException` với `ErrorCode` thích hợp.
- Nếu lỗi do DB constraint: thêm repository test hoặc migration SQL (nêu rõ trong PR nếu cần DB change).
- Nếu changes ảnh hưởng tới business rules: update `docs/business-rules.md` và ghi rõ giả định.

Output
- 1) failing test reproducer
- 2) minimal code patch
- 3) passing tests
- 4) PR-ready description (root cause, fix, tests added)
