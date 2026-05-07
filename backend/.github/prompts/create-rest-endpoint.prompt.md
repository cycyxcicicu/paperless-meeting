# Prompt: Tạo REST endpoint (file-by-file)

Mục đích
- Hướng dẫn chi tiết, theo chuẩn repo, để tạo một REST endpoint mới (create/read/update/delete) cho Paperless Meeting.

Đầu vào (bắt buộc)
- Feature short name (ví dụ: `vote`, `meeting-invite`).
- Mô tả ngắn business (1-3 câu) và acceptance criteria (Given/When/Then).
- Entity hiện có (đường dẫn nếu có) hoặc danh sách trường nếu cần tạo entity mới.
- Quyền truy cập yêu cầu (role/permission) — nếu chưa có, liệt kê giả định.

Kết quả mong muốn
- File-by-file plan (entity?, repository, DTOs, mapper, service, controller, tests).
- Code skeleton cho mỗi file theo conventions dự án (package, annotations, ApiResponse, MapStruct, @Transactional).
- OpenAPI annotations cơ bản (`@Operation`), security hints (CSRF, JWT cookie/header).
- PR checklist (tests, ErrorCode cập nhật nếu cần, docs update).

Các bước thực hiện (chi tiết)
1. Kiểm tra `docs/business-rules.md`, `docs/coding-rules.md`, `docs/api-standards.md` để xác nhận naming và behaviours.
2. Nếu entity chưa tồn tại: tạo `src/main/java/vn/acme/paperless_meeting/entity/<Feature>.java` (UUID PK, extends `SoftDeletable` nếu soft-delete cần thiết).
3. Tạo repository: `src/main/java/vn/acme/paperless_meeting/repository/<Feature>Repository.java` extends `JpaRepository<Entity, UUID>`.
4. Tạo DTOs:
   - Request: `src/main/java/vn/acme/paperless_meeting/dto/request/<feature>/<Feature>UpsertRequest.java` với validation (`@NotBlank`, `@NotNull`, messages SCREAMING_SNAKE_CASE). 
   - Response: `src/main/java/vn/acme/paperless_meeting/dto/response/<feature>/<Feature>Response.java` với `@Getter @Builder`.
5. Tạo MapStruct mapper: `src/main/java/vn/acme/paperless_meeting/mapper/<feature>/<Feature>Mapper.java` with `@Mapper(componentModel = "spring")`.
   - Ignore `id`, `createdAt`, `updatedAt`, relationships in `toEntity` mapping.
6. Implement service: `src/main/java/vn/acme/paperless_meeting/service/<feature>/<Feature>Service.java`.
   - Use `@Service`, `@RequiredArgsConstructor`, `@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)`.
   - Mark mutating methods `@Transactional`.
   - Throw `AppException(ErrorCode.XYZ, "message")` for business errors.
7. Implement controller: `src/main/java/vn/acme/paperless_meeting/controller/<feature>/<Feature>Controller.java`.
   - Use `@RestController`, `@RequestMapping("/[feature-plural]")`, `@RequiredArgsConstructor`.
   - Always return `ApiResponse<T>` (use builder pattern).
   - Add `@Operation` summary/description for OpenAPI.
8. Tests:
   - Unit tests for service (Mockito) under `src/test/java/...`.
   - Mapper tests (MapStruct) using `Mappers.getMapper(...)`.
   - If query logic added, add `@DataJpaTest` repository tests or integration tests with Testcontainers.
9. Docs & PR:
   - Update `docs/business-rules.md` if feature adds/changes rules.
   - Add OpenAPI tags.
   - PR checklist: compile, unit tests, mapper tests, docs updated, ErrorCode updated if needed.

Controller skeleton example (tuân theo repo conventions)

```java
@RestController
@RequestMapping("/meetings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Meeting")
public class MeetingController {
    MeetingService meetingService;

    @PostMapping
    @Operation(summary = "Tạo cuộc họp")
    public ApiResponse<MeetingResponse> create(@Valid @RequestBody MeetingUpsertRequest request) {
        return ApiResponse.<MeetingResponse>builder()
                .success(true)
                .message("Tạo cuộc họp thành công")
                .data(meetingService.create(request))
                .build();
    }
}
```

HTTP status & responses
- POST → 201 Created (kèm `Location` header nếu phù hợp) + `ApiResponse`.
- Read/Update/Delete → 200 OK + `ApiResponse`.
- Validation error → 400; Auth error → 401; Forbidden → 403; Not found → 404; Conflict → 409.

Security notes
- Nếu endpoint thay đổi dữ liệu: bảo đảm CSRF token (cookie-based JWT flow) hoặc header `Authorization: Bearer`.
- Ghi rõ permission cần có (ví dụ `MEETING_CREATE` trên scope MEETING/DEPARTMENT/SYSTEM).

Assumptions (phải liệt kê nếu thiếu)
- Pagination defaults (page=0,size=20) — nếu khác, ghi rõ.
- Nếu migration production cần, nói rõ Flyway/Liquibase chưa có.

Output của prompt này
- Trả về 3 phần: 1) file-by-file plan; 2) code skeletons (entity/repository/dto/mapper/service/controller); 3) test list + PR checklist.
