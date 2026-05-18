---
name: copilot-instructions
description: "Context đầy đủ cho AI khi làm việc với backend Paperless Meeting. Đọc file này TRƯỚC KHI viết bất kỳ dòng code nào."
applyTo: "src/main/java/**, src/test/java/**, pom.xml, src/main/resources/**"
---

# Paperless Meeting — AI Instructions

> **Nguyên tắc cốt lõi (từ Huong_Dan_AI_DEV):**
> - AI KHÔNG thay thế Dev — AI là công cụ hỗ trợ.
> - Mọi output của AI phải được con người review trước khi merge.
> - Không tự bịa business rule — nếu không rõ, hỏi lại hoặc ghi `> Needs clarification`.
> - Luôn đọc code hiện có trước khi viết code mới — **không phát minh pattern mới**.

---

## Dự án là gì?

Backend cho hệ thống **Phòng Họp Không Giấy (Paperless Meeting)** — quản lý cuộc họp, người tham dự, chương trình nghị sự, tài liệu, biểu quyết, phê duyệt, và thông báo. Tất cả thông qua REST API.

---

## Tech Stack (chính xác theo pom.xml)

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| Java | 21 | `<java.version>21</java.version>` |
| Spring Boot | 4.0.3 | Parent POM |
| Spring Data JPA | (theo Boot) | Hibernate, `JpaRepository`, `JpaSpecificationExecutor` |
| Spring Security | (theo Boot) | JWT stateless, CSRF disabled |
| MapStruct | 1.6.3 | `@Mapper(componentModel = "spring")` |
| Lombok | (theo Boot) | `@RequiredArgsConstructor`, `@FieldDefaults`, `@Builder` |
| JJWT | 0.13.0 | `jjwt-api` + `jjwt-impl` + `jjwt-jackson` |
| MySQL | Connector/J | Runtime scope |
| Springdoc OpenAPI | 3.0.1 | Swagger UI tự sinh |
| Mockito | 5.23.0 | Test scope |
| Byte Buddy Agent | 1.17.8 | Test scope (tránh self-attach warning) |

---

## Cấu trúc Package (thực tế trong src/)

```
vn.acme.paperless_meeting
├── config/
│   ├── security/          # SecurityConfig (JWT stateless, CSRF disabled)
│   └── seed/              # SampleDataInitializer
├── controller/{feature}/  # REST controllers theo feature
├── service/{feature}/     # Business logic, transactions
├── repository/            # Spring Data JPA interfaces (flat, không chia thư mục)
├── entity/                # JPA entities (flat)
│   ├── base/              # SoftDeletable (base class cho soft delete)
│   └── enums/             # MeetingStatus, RoleName, ParticipantRole, ...
├── dto/
│   ├── base/              # ApiResponse<T>, PageResponse<T>
│   ├── request/{feature}/ # *UpsertRequest, *Request
│   └── response/{feature}/# *Response
├── mapper/{feature}/      # MapStruct mappers
├── specification/{feature}/ # JPA Specification builders (dynamic filter)
├── exceptions/            # AppException, ErrorCode, GlobalExceptionHandler
├── enums/                 # PublicEndpoint (public endpoints cho SecurityConfig)
└── service/
    ├── auth/              # AuthService, JwtTokenGenerator, JwtTokenVerifier,
    │                      # JwtAuthenticationFilter, CurrentUserService,
    │                      # RefreshTokenService, AuthCookieService
    └── util/              # CookieUtil, ErrorLogger
```

**Lưu ý:** `entity/` và `repository/` đang để flat (không chia thư mục con theo feature). Các layer khác (`controller`, `service`, `mapper`, `dto`, `specification`) thì chia thư mục con theo feature.

---

## Kiến trúc (Layered Architecture)

```
HTTP Request → Controller (parse, validate với @Valid)
             → Service    (business logic, @Transactional, phân quyền)
             → Repository (JPA query, Specification)
             ← Response   (ApiResponse<T> hoặc ApiResponse<PageResponse<T>>)
```

**Nguyên tắc bắt buộc:**
- Controller KHÔNG truy cập Repository trực tiếp.
- Business logic nằm trong Service, KHÔNG trong Controller.
- Dùng MapStruct mapper để chuyển đổi Entity ↔ DTO — KHÔNG copy field thủ công.

---

## Security / Authentication (thực tế trong code)

- **JWT stateless**: Access token trong cookie hoặc `Authorization: Bearer <token>`.
- **CSRF disabled**: Vì JWT signature đã bảo vệ, REST API stateless.
- **Session**: `STATELESS` — không tạo session server-side.
- **Filter**: `JwtAuthenticationFilter` chạy trước `UsernamePasswordAuthenticationFilter`.
- **Public endpoints** (không cần JWT): định nghĩa trong `enums.PublicEndpoint`:
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /actuator/health`
  - `GET /swagger-ui/**`
  - `GET /v3/api-docs/**`
- **Phân quyền trong Service**: Dùng `CurrentUserService` để check role/permission:
  - `currentUserService.getCurrentActiveUser()` → lấy User hiện tại.
  - `currentUserService.hasRole(RoleName.SUPER_ADMIN)` → check role theo enum.
  - `currentUserService.hasAuthority("MEETING_CREATE")` → check permission cụ thể.
- **Roles** (enum `RoleName`): `SUPER_ADMIN`, `DEPARTMENT_ADMIN`, `USER`.

---

## Response Format (ApiResponse — thực tế trong code)

```java
// File: dto/base/ApiResponse.java
public class ApiResponse<T> {
    private boolean success;  // true/false
    private int code;         // Số nguyên (ví dụ: 200 cho OK, 1206 cho MEETING_NOT_EXIST)
    private String message;   // Thông báo
    private T data;           // Payload
}
```

**⚠️ LƯU Ý QUAN TRỌNG (bug hiện tại):**
- Khi dùng Builder, **BẮT BUỘC** phải set `.success(true)` và `.code(200)` cho response thành công.
- Nếu chỉ gọi `.data(response).build()` thì default sẽ là `success=false` và `code=0`.
- Helper method `ApiResponse.success(T data)` đang bị hardcode trả về `code=67` — **KHÔNG dùng**.

**Cách dùng đúng trong Controller:**
```java
return ResponseEntity.ok(ApiResponse.<MeetingResponse>builder()
        .success(true)
        .code(200)
        .message("Thành công")
        .data(response)
        .build());
```

**Phân trang**: Dùng `PageResponse<T>` bọc trong `ApiResponse`:
```java
// File: dto/base/PageResponse.java
public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
}
```

---

## Error Handling (thực tế trong code)

- **Exception class duy nhất**: `AppException(ErrorCode.SOME_CODE)` — không tạo custom exception khác.
- **ErrorCode enum**: Mỗi entry có `int code`, `String message`, `HttpStatusCode statusCode`.
  - Ví dụ: `MEETING_NOT_EXIST(1206, "Cuộc họp không tồn tại", HttpStatus.NOT_FOUND)`
- **GlobalExceptionHandler** tự động chuyển `AppException` → `ApiResponse.error(code, message)` + HTTP status.
- **Validation error**: `@Valid` trên `@RequestBody` → `MethodArgumentNotValidException` → GlobalExceptionHandler tìm `ErrorCode` enum theo tên message.

---

## Entity Pattern (thực tế trong code)

- **Base class**: `SoftDeletable` — cung cấp soft delete:
  - Fields: `isDeleted` (Boolean), `deletedAt` (LocalDateTime), `deletedBy` (User).
  - Annotation: `@SQLRestriction("is_deleted = false")` trên class.
  - Helper: `softDelete(User)`, `restore()`.
- **Primary key**: UUID, `@GeneratedValue(strategy = GenerationType.UUID)`.
- **Soft delete SQL**: `@SQLDelete(sql = "UPDATE ... SET is_deleted = true ...")`.
- **Audit fields**: `createdAt` (`@CreationTimestamp`), `createdBy` (ManyToOne User) — hiện khai báo phân tán trên từng entity (chưa có base auditable).

**Ví dụ thực tế (Meeting entity):**
```java
@Entity
@SQLDelete(sql = "UPDATE meetings SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class Meeting extends SoftDeletable {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String title;
    @Enumerated(EnumType.STRING) private MeetingStatus status;
    @CreationTimestamp private LocalDateTime createdAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by") private User createdBy;
    // ... relationships ...
}
```

---

## Meeting Module (module phức tạp nhất — chi tiết)

### Trạng thái (MeetingStatus enum):
`DRAFT` → `PENDING_APPROVAL` → `UPCOMING` → `IN_PROGRESS` → `CLOSED`
                                    ↘ `REJECTED` (có thể sửa lại và trình duyệt lại)
                        `UPCOMING` hoặc `PENDING_APPROVAL` → `CANCELLED`

### Cron Job tự động:
`MeetingStatusJob` chạy mỗi phút (`@Scheduled(cron = "0 * * * * *")`), quét meeting `UPCOMING` có `startTime <= now()` và tự động chuyển sang `IN_PROGRESS`.

### API hiện có:
| Method | Path | Chức năng | Status cho phép |
|---|---|---|---|
| GET | `/meetings` | Danh sách (phân trang, filter) | Mọi trạng thái |
| GET | `/meetings/{id}` | Chi tiết | Mọi trạng thái |
| POST | `/meetings` | Tạo mới (→ DRAFT) | N/A |
| PUT | `/meetings/{id}` | Sửa | DRAFT, REJECTED |
| POST | `/meetings/{id}/submit-approval` | Trình duyệt | DRAFT, REJECTED → PENDING_APPROVAL |
| POST | `/meetings/{id}/approve` | Phê duyệt | PENDING_APPROVAL → UPCOMING |
| POST | `/meetings/{id}/reject` | Từ chối | PENDING_APPROVAL → REJECTED |
| POST | `/meetings/{id}/cancel` | Hủy | UPCOMING, PENDING_APPROVAL → CANCELLED |
| POST | `/meetings/{id}/close` | Kết thúc | IN_PROGRESS → CLOSED |

### Phân quyền trong MeetingService:
- **View**: SUPER_ADMIN / người tạo / cùng dept (và sub-dept) / participant.
- **Edit**: SUPER_ADMIN / người tạo / DEPARTMENT_ADMIN cùng dept / CHAIR.
- **Approve**: SUPER_ADMIN / DEPARTMENT_ADMIN cùng dept (và sub-dept).

### Validation:
- `startTime` phải trong tương lai, `endTime > startTime`.
- Check trùng lịch phòng họp (`existsRoomConflict`) — loại trừ CANCELLED, REJECTED, DRAFT.

---

## Mapper Pattern (thực tế trong code)

```java
@Mapper(componentModel = "spring")
public interface MeetingMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    // ... ignore tất cả relationship ...
    Meeting toEntity(MeetingUpsertRequest request);

    void updateEntity(MeetingUpsertRequest request, @MappingTarget Meeting meeting);

    @Mapping(target = "locationId", source = "location.id")
    @Mapping(target = "locationName", source = "location.name")
    @Mapping(target = "departmentId", source = "department.id")
    @Mapping(target = "departmentName", source = "department.deptName")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.fullName")
    MeetingResponse toResponse(Meeting meeting);
}
```

**Quy tắc:**
- `toEntity()`: ignore tất cả auto-generated fields và relationships.
- `updateEntity()`: dùng `@MappingTarget` để update entity có sẵn.
- `toResponse()`: map nested fields (entity → flat DTO) bằng `source = "relation.field"`.
- Relationship phức tạp xử lý thủ công trong Service.

---

## Specification Pattern (dynamic filter)

Repository implements `JpaSpecificationExecutor<Meeting>`. Specification builder nằm trong `specification/{feature}/`:

```java
public class MeetingSpecification {
    public static Specification<Meeting> build(String keyword, MeetingStatus status,
            LocalDateTime fromDate, LocalDateTime toDate,
            List<UUID> allowedDeptIds, UUID userId, boolean isSuperAdmin) {
        // Trả về dynamic predicate dựa trên tham số non-null
    }
}
```

---

## Các module khác đã implement

| Module | Controller | Service | Ghi chú |
|---|---|---|---|
| Auth | `AuthController` | `AuthService`, `RefreshTokenService` | Login, refresh, logout |
| User | `UserCrudController` | `UserService` | CRUD, liên kết Department + Position |
| Department | `DepartmentController` | `DepartmentService` | Phân cấp cha/con, `getAllSubDepartmentIds()` |
| Location | `LocationController` | `LocationService` | Quản lý phòng họp |
| Position | `PositionController` | `PositionService` | Chức danh công việc |
| Role | `RoleController` | `RoleService` | Quản lý vai trò hệ thống |
| Permission | `PermissionController` | `PermissionService` | Quản lý quyền |

---

## Các module CÓ Entity/DTO nhưng CHƯA có Controller

- **MeetingParticipant**: Có entity, DTOs (`AddParticipantRequest`, `UpdateAttendanceStatusRequest`, `UpdateInviteStatusRequest`, `UpdateParticipantRoleRequest`, `ParticipantResponse`), repository. **CHƯA** có controller/service endpoint.
- **AgendaItem, MeetingDocument, Document**: Có entity + repository. Chưa có controller.
- **VoteSession, VoteBallot, Motion**: Có entity + repository. Chưa có controller.
- **Minutes, ApprovalRequest**: Có entity + repository. Chưa có controller.

---

## KHÔNG được làm (constraints)

1. **KHÔNG tạo custom exception class** — chỉ dùng `AppException(ErrorCode.XXX)`.
2. **KHÔNG trả raw object** — luôn bọc trong `ApiResponse<T>`.
3. **KHÔNG truy cập Repository từ Controller** — phải qua Service.
4. **KHÔNG copy field thủ công** — dùng MapStruct mapper.
5. **KHÔNG commit secret** — JWT secret, DB password phải dùng environment variable.
6. **KHÔNG thêm BOM vào file Java** — trên Windows cẩn thận UTF-8 BOM.
7. **KHÔNG bịa business rule** — chỉ implement những gì có trong `docs/business-rules.md` hoặc code hiện tại.
8. **KHÔNG refactor** trừ khi được owner cho phép rõ ràng.

---

## Quickstart

```bash
# Build (compile + unit tests)
mvn clean package

# Build không test
mvn -DskipTests clean package

# Chạy dev
mvn spring-boot:run

# Chỉ chạy test
mvn test

# Chạy 1 test class
mvn -Dtest=MeetingServiceTest test
```

**Yêu cầu**: Java 21, MySQL 8.0+, Maven 3.9+, annotation processing enabled (MapStruct + Lombok).

---

## Tài liệu tham khảo (đọc theo thứ tự)

1. [docs/business-rules.md](../docs/business-rules.md) — Ràng buộc nghiệp vụ, quan hệ entity, trạng thái.
2. [docs/coding-rules.md](../docs/coding-rules.md) — Naming convention, code structure, pattern bắt buộc.
3. [docs/api-standards.md](../docs/api-standards.md) — Chuẩn REST API, response format, HTTP status code.
4. [docs/project-architecture.md](../docs/project-architecture.md) — Kiến trúc tổng thể.
5. [docs/current-backend-snapshot.md](../docs/current-backend-snapshot.md) — Snapshot trạng thái hiện tại.
6. [docs/meeting-module-analysis.md](../docs/meeting-module-analysis.md) — Phân tích chi tiết module Meeting.
7. [docs/meeting-roadmap.md](../docs/meeting-roadmap.md) — Lộ trình phát triển.
8. [.github/PRE-FLIGHT-CHECKLIST.md](PRE-FLIGHT-CHECKLIST.md) — Checklist trước khi code.

---

## Quy trình làm việc với AI (theo Huong_Dan_AI_DEV)

1. **Đọc context**: Đọc file này + docs liên quan TRƯỚC KHI viết code.
2. **Phân tích trước**: Tìm module tương tự đã có (auth, meeting, user) và replicate pattern.
3. **Lập plan**: Liệt kê file cần tạo/sửa, get approval từ owner.
4. **Implement**: Theo đúng pattern hiện có, KHÔNG phát minh cách mới.
5. **Review**: Kiểm tra output có vi phạm constraints hay business rules không.
6. **Test**: Chạy `mvn clean package` để verify compilation.

---

*Cập nhật lần cuối: 2026-05-14. File này được sinh từ source code thực tế, không phải từ docs cũ.*
