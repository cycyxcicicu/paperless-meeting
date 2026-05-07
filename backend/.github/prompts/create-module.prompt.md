# Create a New REST Module

**Purpose:** Implement a new REST endpoint with full layers (Controller → Service → Repository) following the Spring Boot layered architecture and project conventions.

## Pre-Implementation Checklist

**DO NOT SKIP THIS SECTION.**

1. **Inspect Similar Modules**
    - Identify 1–2 existing modules that perform similar functionality (e.g., CRUD, queries, validation logic).
    - Read their complete implementations:
        - Controller: endpoint signatures, request validation, response wrapping.
        - Service: business logic, transaction scope, exception handling.
        - DTOs: naming, validation annotations.
        - Mapper: entity-to-DTO and DTO-to-entity conversions.
        - Repository: custom queries if any.
    - Document the patterns you observe.

2. **Verify Business Rules**
    - Check `docs/business-rules.md` for the entity and feature being implemented.
    - Confirm you understand constraints, relationships, uniqueness rules, and valid state transitions.
    - If a rule is ambiguous or missing, flag it and request clarification before proceeding.
    - **DO NOT invent business rules.**

3. **Review Existing Error Codes**
    - Check `src/main/java/vn/acme/paperless_meeting/exceptions/ErrorCode.java`.
    - Identify error codes relevant to your module (e.g., `USER_NOT_FOUND`, `UNAUTHORIZED`, `INVALID_REQUEST`).
    - If you need new error codes, justify each one and add them to the enum.

4. **Plan File Structure (Required)**
    - Present a **file-by-file plan** before generating code.
    - For each file, provide:
        - Relative path (e.g., `src/main/java/vn/acme/paperless_meeting/controller/feature/FeatureController.java`).
        - One-line purpose.
    - Include request DTO, response DTO, mapper, repository, service, controller, and tests.
    - Request approval before proceeding.

## Implementation Guidelines

1. **Controller Layer**
    - Keep controllers thin: validate requests, call service methods, wrap responses in `ApiResponse<>`.
    - Use `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`.
    - Annotate request bodies with `@Valid` to trigger validation.
    - Always return `ApiResponse<?>` with appropriate status codes (200, 201, 400, 404, 500, etc.).
    - Example:
        ```java
        @PostMapping
        public ResponseEntity<?> createFoo(@Valid @RequestBody FooUpsertRequest request) {
            FooResponse response = fooService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
        }
        ```

2. **Service Layer**
    - Place all business logic: validation, transformation, transaction management.
    - Mark transactional boundaries with `@Transactional` (or `@Transactional(readOnly = true)` for queries).
    - Throw `AppException(ErrorCode.SOME_CODE, "message")` for exceptional conditions.
    - Do not access repositories directly from controllers.
    - Depend on mappers to convert between entities and DTOs.
    - Example:
        ```java
        @Service
        @Transactional
        public class FooService {
            @Autowired private FooRepository fooRepository;
            @Autowired private FooMapper fooMapper;

            public FooResponse create(FooUpsertRequest request) {
                if (fooRepository.existsByName(request.getName())) {
                    throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Foo already exists");
                }
                Foo foo = fooMapper.toEntity(request);
                Foo saved = fooRepository.save(foo);
                return fooMapper.toResponse(saved);
            }
        }
        ```

3. **DTOs**
    - Request DTOs: use `*Request` or `*UpsertRequest` naming.
    - Response DTOs: use `*Response` naming.
    - Add validation annotations: `@NotNull`, `@NotBlank`, `@Min`, `@Max`, `@Email`, `@Pattern`, etc.
    - Use Lombok: `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor` for brevity.
    - Example:
        ```java
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public class FooUpsertRequest {
            @NotBlank(message = "Name is required")
            private String name;
            @NotNull(message = "Status is required")
            private FooStatus status;
        }
        ```

4. **Mapper**
    - Use MapStruct with `@Mapper(componentModel = "spring")`.
    - Define methods to convert Entity ↔ DTO.
    - For complex fields (e.g., nested objects, relationships), use `@Mapping(ignore = true)` to exclude and handle manually if needed.
    - Example:
        ```java
        @Mapper(componentModel = "spring")
        public interface FooMapper {
            Foo toEntity(FooUpsertRequest request);
            FooResponse toResponse(Foo foo);
            List<FooResponse> toResponseList(List<Foo> foos);
        }
        ```

5. **Repository**
    - Extend `JpaRepository<Entity, KeyType>`.
    - Define custom query methods using Spring Data naming or `@Query` annotation.
    - Example:
        ```java
        public interface FooRepository extends JpaRepository<Foo, UUID> {
            Optional<Foo> findByNameAndDeptId(String name, UUID deptId);
            List<Foo> findBySoftDeletedFalse(Pageable pageable);
        }
        ```

6. **Exception Handling**
    - Always throw `AppException` with an `ErrorCode` for user-facing errors.
    - The `GlobalExceptionHandler` will map it to HTTP response automatically.
    - Do not craft custom JSON error responses in controllers.
    - Example:
        ```java
        if (foo == null) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Foo not found with ID: " + id);
        }
        ```

7. **Validation**
    - Use `@Valid` on controller parameters to trigger DTO validation.
    - Reuse existing error codes for validation failures (or add domain-specific codes to `ErrorCode.java`).
    - The global exception handler will convert validation errors to `ApiResponse` with status 400.

8. **Soft Delete Handling**
    - If the entity extends `SoftDeletable`, ensure repository queries respect the `soft_deleted` flag.
    - Example: `findBySoftDeletedFalse()` or filter in service logic.

## Testing Guidelines

1. **Unit Tests for Services**
    - Test business logic: positive cases, error cases, edge cases.
    - Use Mockito for repository mocks.
    - Verify that the correct error code is thrown.
    - Example:
        ```java
        @Test
        void testCreateFooDuplicate() {
            FooUpsertRequest request = new FooUpsertRequest("test", FooStatus.ACTIVE);
            when(fooRepository.existsByName("test")).thenReturn(true);

            AppException ex = assertThrows(AppException.class, () -> fooService.create(request));
            assertEquals(ErrorCode.DUPLICATE_RESOURCE, ex.getErrorCode());
        }
        ```

2. **Integration Tests for Controllers**
    - Use `@SpringBootTest` with `MockMvc` or `WebTestClient`.
    - Test endpoint paths, HTTP methods, status codes, and response structure.
    - Test validation failures and error responses.

## Output Format

Provide:

1. **File-by-file plan** (paths + one-line purpose).
2. **Code for each file** (controller, service, DTOs, mapper, repository, tests).
3. **Notes** on any assumptions or business rule clarifications needed.

## Notes

- Do not commit code without tests.
- Do not skip the pre-implementation checklist.
- If a similar module exists, reuse its patterns exactly.
- If business rules are ambiguous, request clarification before coding.
