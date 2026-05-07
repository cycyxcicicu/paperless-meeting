# Analyze Repository Structure

**Purpose:** Understand the codebase, identify patterns, and gather context before implementing changes.

## Instructions

1. **Inventory Controllers**
   - List all controller classes under `src/main/java/vn/acme/paperless_meeting/controller/`.
   - For each, note the feature group (auth, meeting, user, etc.) and endpoint base path.
   - Identify common patterns: request validation, response envelope, error handling.

2. **Inventory Services**
   - List all service classes under `src/main/java/vn/acme/paperless_meeting/service/`.
   - For each, note:
     - Public method signatures.
     - Repositories it depends on.
     - Whether it uses `@Transactional` and at what scope.
     - Use of custom exceptions (`AppException` with `ErrorCode`).

3. **Inventory Entities**
   - List all entity classes under `src/main/java/vn/acme/paperless_meeting/entity/`.
   - For each, note:
     - Primary key type (UUID, Long, etc.).
     - Whether it extends `SoftDeletable` or other base classes.
     - Key relationships (@OneToMany, @ManyToMany, @ManyToOne, etc.).

4. **Inventory DTOs**
   - List request DTOs under `src/main/java/vn/acme/paperless_meeting/dto/request/`.
   - List response DTOs under `src/main/java/vn/acme/paperless_meeting/dto/response/`.
   - Note naming patterns: `*Request`, `*UpsertRequest`, `*Response`.
   - Identify validation annotations used (@NotNull, @NotBlank, @Min, @Max, @Email, etc.).

5. **Inventory Mappers**
   - List all mappers under `src/main/java/vn/acme/paperless_meeting/mapper/`.
   - For each, note:
     - Source and target types.
     - Whether `componentModel = "spring"` is used.
     - Any ignored or mapped fields.

6. **Inventory Repositories**
   - List all repository interfaces under `src/main/java/vn/acme/paperless_meeting/repository/`.
   - For each, note:
     - Entity type and primary key type.
     - Custom query methods (beyond CRUD).
     - Use of Spring Data annotations (@Query, @Modifying, etc.).

7. **Review Error Handling**
   - Read `src/main/java/vn/acme/paperless_meeting/exceptions/ErrorCode.java`.
   - List defined error codes and their HTTP status mappings.
   - Read `src/main/java/vn/acme/paperless_meeting/exceptions/GlobalExceptionHandler.java` to understand exception-to-response mapping.

8. **Review Response Patterns**
   - Read `src/main/java/vn/acme/paperless_meeting/dto/base/ApiResponse.java`.
   - Confirm structure: success flag, error code, message, data payload.
   - Note factory methods or helpers for building responses.

9. **Identify Incomplete/Placeholder Code**
   - Search for TODO comments, `return null`, `throw new UnsupportedOperationException`, or commented-out logic.
   - Flag modules that are stubs or partial implementations.

10. **Document Findings**
    - Summarize the current state of the codebase in a structured outline.
    - Identify any missing modules or gaps in the architecture.
    - Note reusable patterns and conventions for future reference.

## Output Format

Provide findings as:
- **Controllers:** list with feature groups and base paths.
- **Services:** list with dependencies and transactional scope.
- **Entities:** list with key types, base classes, and relationships.
- **DTOs:** list with naming patterns and validation annotations.
- **Mappers:** list with source/target and configuration.
- **Repositories:** list with entity types and custom queries.
- **Error Handling:** list of error codes and their meanings.
- **Gaps/Placeholders:** list of incomplete modules and TODOs.

## Notes

- Do not invent modules or patterns not visible in the source code.
- Focus on observable facts: class names, method signatures, annotations, relationships.
- Use this output as the foundation for planning new features or refactoring.
