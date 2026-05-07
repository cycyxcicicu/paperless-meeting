# Coding Rules & Conventions

This document outlines observable coding conventions in the Paperless Meeting repository. Adhere to these patterns when adding or modifying code.

---

## Package Naming

**Pattern:** `vn.acme.paperless_meeting.[layer].[feature]`

- **Layer:** controller, service, repository, mapper, dto, entity, exceptions, enums, config
- **Feature:** auth, meeting, user, department, location, role, permission, etc. (lowercase, singular or plural as appropriate)

**Examples:**

- `vn.acme.paperless_meeting.controller.meeting`
- `vn.acme.paperless_meeting.service.auth`
- `vn.acme.paperless_meeting.repository` (no feature subdivision)
- `vn.acme.paperless_meeting.dto.request.meeting`
- `vn.acme.paperless_meeting.dto.response.user`
- `vn.acme.paperless_meeting.mapper.meeting`

---

## Controller Naming & Structure

**Class Naming:** `[Feature]Controller` (e.g., `MeetingController`, `AuthController`)

**Location:** `src/main/java/vn/acme/paperless_meeting/controller/{feature}/`

**Annotations:**

- `@RestController` — marks this as a REST endpoint handler.
- `@RequestMapping("/[feature-plural]")` — base path for endpoints (e.g., `/meetings`, `/auth`, `/users`).
- `@RequiredArgsConstructor` — Lombok constructor injection.
- `@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)` — Lombok field access modifiers.

**Method Conventions:**

- Use standard HTTP methods: `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`.
- Parameter validation: `@Valid @RequestBody [DTO] request`.
- Return an `ApiResponse<T>` for all endpoints (never return raw objects).
- Always build responses using `ApiResponse.<T>builder().success(true).message("...").data(...).build()`.

**Example:**

```java
@RestController
@RequestMapping("/meetings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MeetingController {
    MeetingService meetingService;

    @GetMapping
    public ApiResponse<List<MeetingResponse>> findAll() {
        return ApiResponse.<List<MeetingResponse>>builder()
                .success(true)
                .message("Lấy danh sách cuộc họp thành công")
                .data(meetingService.findAll())
                .build();
    }

    @PostMapping
    public ApiResponse<MeetingResponse> create(@Valid @RequestBody MeetingUpsertRequest request) {
        return ApiResponse.<MeetingResponse>builder()
                .success(true)
                .message("Tạo cuộc họp thành công")
                .data(meetingService.create(request))
                .build();
    }
}
```

---

## Service Naming & Structure

**Class Naming:** `[Feature]Service` (e.g., `MeetingService`, `AuthService`)

**Location:** `src/main/java/vn/acme/paperless_meeting/service/{feature}/`

**Annotations:**

- `@Service` — marks this as a service bean.
- `@RequiredArgsConstructor` — Lombok constructor injection.
- `@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)` — immutable fields.
- `@Transactional` — marks methods that modify data (not needed for read-only methods).

**Method Conventions:**

- Public methods perform business logic: transformation, validation, error handling.
- Inject repositories and mappers (never do raw DB access in services).
- Throw `AppException(ErrorCode.SOME_CODE, ...)` for exceptional conditions.
- Use mappers to convert between entities and DTOs (never manual field copying).

**Example:**

```java
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MeetingService {
    MeetingRepository meetingRepository;
    MeetingMapper meetingMapper;

    @Transactional
    public MeetingResponse create(MeetingUpsertRequest request) {
        // Validation
        if (meetingRepository.existsConflict(...)) {
            throw new AppException(ErrorCode.CONFLICT, "Meeting time conflict");
        }
        // Map and save
        Meeting entity = meetingMapper.toEntity(request);
        Meeting saved = meetingRepository.save(entity);
        return meetingMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public MeetingResponse findById(UUID id) {
        Meeting entity = meetingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Meeting not found"));
        return meetingMapper.toResponse(entity);
    }
}
```

---

## Request/Response DTO Naming

### Request DTOs

**Class Naming:**

- `[Feature]UpsertRequest` — generic create/update (most common).
- `[Feature]Request` — simple request (create only or alternative action).
- `[Feature][Verb]Request` — action-specific (e.g., `MeetingCancelRequest`, `MeetingScheduleRequest`).

**Location:** `src/main/java/vn/acme/paperless_meeting/dto/request/{feature}/`

**Annotations:**

- `@Getter`, `@Setter` — Lombok field accessors.
- Validation: `@NotBlank`, `@NotNull`, `@Size`, `@Email`, `@Min`, `@Max`, `@Pattern`, etc.
- Message format: `@NotBlank(message = "FIELD_REQUIRED")` (uses error code format for consistency).

**Example:**

```java
@Getter
@Setter
public class MeetingUpsertRequest {
    @NotBlank(message = "MEETING_TITLE_REQUIRED")
    @Size(max = 255, message = "MEETING_TITLE_INVALID")
    private String title;

    @Size(max = 5000)
    private String description;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private UUID departmentId;
}
```

### Response DTOs

**Class Naming:** `[Feature]Response` (e.g., `MeetingResponse`, `UserResponse`)

**Location:** `src/main/java/vn/acme/paperless_meeting/dto/response/{feature}/`

**Annotations:**

- `@Getter` — read-only fields.
- `@Builder` — builder pattern for construction.
- No validation annotations (responses are outputs, not inputs).

**Example:**

```java
@Getter
@Builder
public class MeetingResponse {
    private UUID id;
    private String title;
    private String description;
    private MeetingStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    private UUID departmentId;
    private String departmentName;
}
```

---

## Exception Handling

**Exception Class:** Reuse `AppException` from `vn.acme.paperless_meeting.exceptions.AppException`

**Error Codes:** Use the `ErrorCode` enum from `vn.acme.paperless_meeting.exceptions.ErrorCode`

**Throwing Exceptions:**

```java
throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
throw new AppException(ErrorCode.INVALID_STATE_TRANSITION, "Cannot cancel a closed meeting");
```

**Error Code Format:**

- Enum value: SCREAMING_SNAKE_CASE (e.g., `USER_NOT_FOUND`, `INVALID_REQUEST`)
- HTTP status: mapped in the enum (e.g., 404 NOT_FOUND, 400 BAD_REQUEST, 409 CONFLICT)
- Message: user-friendly string (e.g., "User not found", "Invalid request")

**Global Exception Handling:**

- All `AppException` instances are caught by `GlobalExceptionHandler` and converted to `ApiResponse` with appropriate HTTP status.
- Do not create custom exception classes or handlers.
- Do not return custom JSON error responses from controllers.

---

## Repository Method Naming

**Class Naming:** `[Entity]Repository` (e.g., `MeetingRepository`, `UserRepository`)

**Base Interface:** `extends JpaRepository<Entity, UUID>`

**Location:** `src/main/java/vn/acme/paperless_meeting/repository/`

**Method Naming Conventions:**

- **Finders:** `findBy*`, `findAllBy*`, `Optional<T> findById(UUID id)`.
- **Existence checks:** `existsBy*`.
- **Counts:** `countBy*`.
- **Custom logic:** use `@Query` with JPQL or SQL.

**Spring Data Naming Examples:**

```java
public interface MeetingRepository extends JpaRepository<Meeting, UUID> {
    Optional<Meeting> findByIdAndSoftDeletedFalse(UUID id);
    List<Meeting> findAllByStatusOrderByCreatedAtDesc(MeetingStatus status);
    boolean existsByTitleAndDepartmentId(String title, UUID deptId);
}
```

**Complex Queries with `@Query`:**

```java
@Query("""
    SELECT m FROM Meeting m
    WHERE m.departmentId = :deptId
    AND m.status = :status
    AND m.softDeleted = false
    ORDER BY m.createdAt DESC
    """)
List<Meeting> findByDepartmentAndStatus(@Param("deptId") UUID deptId, @Param("status") MeetingStatus status);
```

**Key Patterns:**

- Always filter `soft_deleted = false` in queries (unless querying soft-deleted records explicitly).
- Use `@EntityGraph(attributePaths = {...})` to eagerly load related entities and prevent N+1 queries.
- Use `Pageable` parameter for large result sets: `Page<Meeting> findByStatus(..., Pageable pageable)`.
- Mark mutating queries with `@Modifying` and `@Transactional`.

---

## Mapper Usage

**Class Naming:** `[Entity]Mapper` (e.g., `MeetingMapper`, `UserMapper`)

**Location:** `src/main/java/vn/acme/paperless_meeting/mapper/{feature}/`

**Annotation:** `@Mapper(componentModel = "spring")`

**Method Conventions:**

- `Entity toEntity(Request request)` — convert request DTO to entity.
- `Response toResponse(Entity entity)` — convert entity to response DTO.
- `List<Response> toResponseList(List<Entity> entities)` — convert entity list.

**Field Mapping:**

- Use `@Mapping(target = "field", ignore = true)` to exclude complex fields (relationships, auto-generated fields).
- Let MapStruct auto-map simple fields (matching names and types).
- Handle relationships manually in the service layer.

**Example:**

```java
@Mapper(componentModel = "spring")
public interface MeetingMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "location", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "meetingParticipantList", ignore = true)
    Meeting toEntity(MeetingUpsertRequest request);

    @Mapping(target = "locationName", expression = "java(entity.getLocation() != null ? entity.getLocation().getName() : null)")
    @Mapping(target = "departmentName", expression = "java(entity.getDepartment() != null ? entity.getDepartment().getName() : null)")
    MeetingResponse toResponse(Meeting entity);

    List<MeetingResponse> toResponseList(List<Meeting> entities);
}
```

---

## Validation Conventions

**Location:** Validation annotations in request DTOs and entity constraints.

**Validation Triggers:**

- Controllers: use `@Valid` on `@RequestBody` parameters to trigger DTO validation.
- The framework automatically converts validation errors to 400 BAD_REQUEST responses via `GlobalExceptionHandler`.

**Common Annotations (Jakarta Validation):**

- `@NotNull` — field must not be null.
- `@NotBlank` — string must not be null or whitespace.
- `@Size(min = ..., max = ...)` — string/collection length constraints.
- `@Min(...)`, `@Max(...)` — numeric bounds.
- `@Email` — email format validation.
- `@Pattern(regexp = "...")` — regex validation.
- `@Future`, `@Past` — date constraints.

**Message Format:**

- Use error code format (SCREAMING_SNAKE_CASE): `@NotBlank(message = "TITLE_REQUIRED")`
- These match `ErrorCode` enum values for consistency.
- Custom validators: throw `AppException(ErrorCode....)` in service methods.

**Example:**

```java
@Getter
@Setter
public class UserUpsertRequest {
    @NotBlank(message = "USERNAME_REQUIRED")
    @Size(min = 3, max = 50, message = "USERNAME_INVALID")
    private String username;

    @NotBlank(message = "EMAIL_REQUIRED")
    @Email(message = "EMAIL_INVALID")
    private String email;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(min = 8, message = "PASSWORD_INVALID")
    private String password;
}
```

---

## Rules for Adding New Modules

When adding a feature (e.g., new entity, new workflow), follow this structure:

### 1. **Create Entity**

- File: `src/main/java/vn/acme/paperless_meeting/entity/[Feature].java`
- Naming: PascalCase, singular (e.g., `Document`, `VoteSession`)
- Extend `SoftDeletable` base class if needed (for soft-delete support).
- Use UUID as primary key.

### 2. **Create Repository**

- File: `src/main/java/vn/acme/paperless_meeting/repository/[Feature]Repository.java`
- Extend `JpaRepository<Entity, UUID>`.
- Follow Spring Data naming conventions for query methods.

### 3. **Create DTOs**

- Request: `src/main/java/vn/acme/paperless_meeting/dto/request/{feature}/[Feature]UpsertRequest.java`
- Response: `src/main/java/vn/acme/paperless_meeting/dto/response/{feature}/[Feature]Response.java`
- Add validation annotations to request DTO.

### 4. **Create Mapper**

- File: `src/main/java/vn/acme/paperless_meeting/mapper/{feature}/[Feature]Mapper.java`
- Use `@Mapper(componentModel = "spring")`.
- Implement `toEntity()`, `toResponse()`, `toResponseList()`.

### 5. **Create Service**

- File: `src/main/java/vn/acme/paperless_meeting/service/{feature}/[Feature]Service.java`
- Use `@Service`, `@RequiredArgsConstructor`, `@FieldDefaults(..)`.
- Inject repository and mapper.
- Mark data-modifying methods with `@Transactional`.
- Throw `AppException(ErrorCode....)` for errors.

### 6. **Create Controller**

- File: `src/main/java/vn/acme/paperless_meeting/controller/{feature}/[Feature]Controller.java`
- Use `@RestController`, `@RequestMapping("/[feature-plural]")`.
- Delegate to service; wrap all responses in `ApiResponse<>`.
- Use `@Valid` on request DTOs.

### 7. **Add Error Codes (if needed)**

- Update `src/main/java/vn/acme/paperless_meeting/exceptions/ErrorCode.java` enum.
- Add new codes with descriptive names, messages, and HTTP status.
- Do not invent business logic in error codes; use only for error identification.

### 8. **Create Tests**

- Unit tests: service business logic, exception handling.
- Integration tests: e2e controller → service → repository.
- Use `@DataJpaTest` for repository tests, `@SpringBootTest` for integration tests.

### 9. **Update Business Rules (if needed)**

- Document entity constraints, relationships, state transitions in `docs/business-rules.md`.
- Any ambiguities should be flagged and clarified with product.

---

## Summary Checklist for New Modules

- [ ] Entity class created with UUID key and soft-delete (if applicable).
- [ ] Repository interface extends `JpaRepository` with query methods following Spring Data naming.
- [ ] Request DTO with validation annotations (NotBlank, Size, Email, etc.).
- [ ] Response DTO with @Getter and @Builder.
- [ ] Mapper interface with `@Mapper(componentModel = "spring")`.
- [ ] Service class with `@Service`, `@Transactional`, injection of repository and mapper.
- [ ] Controller with `@RestController`, `@Valid`, `ApiResponse` wrapping.
- [ ] Error codes added to `ErrorCode.java` enum (if needed).
- [ ] Unit and integration tests cover happy paths and error cases.
- [ ] Business rules documented in `docs/business-rules.md` (if needed).
- [ ] Code follows the exact patterns shown in existing modules (auth, meeting, user, etc.).

---

## Notes

- **Do not invent patterns.** Inspect existing modules (auth, meeting, user) and replicate their structure exactly.
- **Do not create custom exceptions.** Always use `AppException` with an `ErrorCode` enum value.
- **Do not skip validation.** Use `@Valid` in controllers and validation annotations in DTOs.
- **Do not commit secrets.** Configuration like `app.security.jwt-secret-base64` must use environment overrides, not hardcoded values.
- **Do not over-fetch data.** Use projections and `@EntityGraph` to prevent N+1 query problems.
- **Do not invent business rules.** Document only rules visible in the code or explicitly provided by product.
