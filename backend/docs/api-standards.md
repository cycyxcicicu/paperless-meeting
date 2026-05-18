# Tiêu chuẩn API — Paperless Meeting

Mục đích: cung cấp các quy ước cụ thể, tập trung và áp dụng trực tiếp cho backend Paperless Meeting trong repository này. Tài liệu này không viết các nguyên tắc REST chung chung mà cố gắng bám sát cấu trúc hiện có (ví dụ: `ApiResponse`, `AppException`, `ErrorCode`, MapStruct mappers, UUID cho khoá chính, v.v.).

Phạm vi: mọi endpoint REST được triển khai trong `src/main/java/vn/acme/paperless_meeting/controller/`.

1) Nguyên tắc chung
- RESTful, dùng danh từ ở dạng số nhiều cho tài nguyên: `/meetings`, `/users`, `/documents`, `/roles`.
- Mỗi tài nguyên chính dùng UUID làm định danh trong đường dẫn: `/meetings/{meetingId}` (kiểu `UUID`).
- Tất cả endpoints trả về bao gói `ApiResponse<T>` (không trả raw object). Thực thi theo mẫu đã có trong codebase: `ApiResponse.<T>builder().success(...).message(...).data(...).build()`.
- Content-Type mặc định: `application/json` cho request/response; file upload dùng `multipart/form-data`.

2) Dạng trả về chuẩn (ApiResponse)
- Trường phổ biến trong project: `success`, `code`, `message`, `data`.
- Ví dụ success (POST trả về object tạo mới):

```json
{
  "success": true,
  "code": 200,
  "message": "Tạo cuộc họp thành công",
  "data": { "id": "5f3b...-..." }
}
```

- Ví dụ lỗi (business error):

```json
{
  "success": false,
  "code": 1206,
  "message": "Cuộc họp không tồn tại",
  "data": null
}
```

Ghi chú: `code` tương ứng với enum `ErrorCode` (xem `src/main/java/vn/acme/paperless_meeting/exceptions/ErrorCode.java`).

3) HTTP method → status code (quy ước dự án)
- POST (tạo): 201 Created + body `ApiResponse<T>` (nên kèm header `Location: /<resource>/{id}` khi phù hợp).
- GET (lấy): 200 OK + `ApiResponse<T>`.
- PUT/PATCH (cập nhật): 200 OK + `ApiResponse<T>`.
- DELETE (xóa): 200 OK + `ApiResponse<null>` (project dùng `ApiResponse` cho mọi endpoint — tránh trả raw 204 để duy trì nhất quán với convention hiện có).
- Validation error: 400 Bad Request + `ApiResponse` với `code` tương ứng (ví dụ `INVALID_REQUEST`).
- Authentication required: 401 Unauthorized.
- Forbidden/không có quyền: 403 Forbidden.
- Không tìm thấy tài nguyên: 404 Not Found (ví dụ `RESOURCE_NOT_FOUND`).
- Conflict (ví dụ trùng unique): 409 Conflict (ví dụ `CONFLICT`).
- Lỗi server: 500 Internal Server Error (nên ít xảy ra vì `AppException` được dùng cho lỗi business).

4) Đặt tên URL & tham số
- Dùng số nhiều và tiếng Anh, không dùng động từ: `/meetings` not `/getMeetings`.
- Tham số đường dẫn: `{meetingId}`, `{userId}` — kiểu UUID.
- Truy vấn lọc & phân trang: `?page=0&size=20&sort=createdAt,desc&status=scheduled`.
- Khi cần nested resources (mối quan hệ chặt chẽ): `/meetings/{meetingId}/agenda-items`, `/meetings/{meetingId}/participants`.

5) Phân trang & trả về danh sách
- Khi controller trả `Page<T>`, chuyển sang DTO trang hoá chuẩn trước khi bọc vào `ApiResponse`.
- Định dạng khuyến nghị (ví dụ `PagedResponse<T>`):

```json
{
  "success": true,
  "code": 200,
  "message": "",
  "data": {
    "content": [ /* list */ ],
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 123,
    "totalPages": 7
  }
}
```

Gợi ý triển khai: thêm `dto/response/base/PagedResponse.java` để tái sử dụng trong controllers.

6) Request body & validation
- Dùng DTO `*UpsertRequest` và Jakarta Validation (`@NotNull`, `@NotBlank`, `@Size`, ...).
- Controller phải khai báo `@Valid @RequestBody`.
- Validation errors được chuyển bởi `GlobalExceptionHandler` sang `ApiResponse` với `success=false` và `code` tương ứng.

7) Lỗi & AppException
- Mọi lỗi nghiệp vụ phải ném `AppException(ErrorCode.XYZ, "message")`.
- `GlobalExceptionHandler` map `AppException` → `ApiResponse` + HTTP status theo `ErrorCode`.
- Log lỗi phải bao gồm context (resource id, user id, correlation id nếu có). Nếu cần correlation id, dùng header `X-Request-Id` (khuyến nghị — nếu hệ thống logging hỗ trợ).

8) Bảo mật & CSRF
- Token JWT: project cho phép token từ cookie hoặc `Authorization: Bearer <token>` (xem `AuthCookieService` và `JwtAuthenticationFilter`).
- Nếu client sử dụng cookie để lưu JWT, mọi endpoint thay đổi dữ liệu phải kèm token CSRF trong header `X-CSRF-TOKEN` (project đã có `/csrf` endpoint).
- Các endpoint public được khai báo trong `SecurityConfig` (ví dụ `/auth/login`, `/auth/refresh`, swagger, `/csrf`). Kiểm tra `src/main/java/vn/acme/paperless_meeting/config/security/SecurityConfig.java` khi thêm endpoint public.

9) File upload
- Endpoints upload file: `multipart/form-data`.
- Response: trả `DocumentResponse` (id + currentVersion) bọc trong `ApiResponse`.

10) OpenAPI / Documentation
- Sử dụng `springdoc-openapi` đã có trong project. Khi thêm endpoint, bổ sung `@Operation(summary = "...", description = "...")` và `@Tag` cho controller để tài liệu rõ ràng.

11) Versioning
- Hiện tại repository không dùng versioned path. Quy chuẩn tạm thời:
  - Giữ nguyên không version nếu thay đổi tương thích ngược.
  - Nếu breaking change cần phát hành: tạo path `/v1/...` hoặc `/v2/...` và thông báo rõ trong changelog.
  - **Giả định**: team chưa bật API versioning — nếu muốn, cần thống nhất trước khi áp dụng.

12) Các quy ước khác & giả định
- Tên trường JSON: camelCase (phù hợp với DTO Java hiện có).
- Tất cả id là UUID: client gửi chuỗi UUID hợp lệ.
- Pagination default: `page=0`, `size=20`, max `size=100` (đặt mặc định ở controller/service hoặc via config). — **Giả định**: giới hạn này chưa có trong repo nên developer cần cấu hình nếu muốn bắt buộc.
- Các action có side effect (e.g., mở vote, finalize minutes) phải xác định rõ quyền (Role/Permission) trước khi implement endpoint; tham khảo `AclEntry` / `UserRoleScope` để ánh xạ quyền.

---
Nếu có yêu cầu bổ sung (ví dụ: chuẩn cụ thể cho pagination response hoặc schema OpenAPI cho các lỗi), phản hồi và tôi sẽ cập nhật file này theo đáp án sản phẩm.
