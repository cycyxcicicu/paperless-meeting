# Prompt: Review code against project rules

Purpose
- Review given code changes or a PR for strict adherence to `docs/coding-rules.md`, `docs/business-rules.md`, `docs/project-architecture.md`, `docs/api-standards.md` and `docs/test-strategy.md`.

Inputs
- PR number or list of changed files (paths). 
- Optional: intended feature description and acceptance criteria.

Checklist (run for each changed file)
1) Package & naming
   - Package matches `vn.acme.paperless_meeting.[layer].[feature]`.
   - Class names follow patterns: `XController`, `XService`, `XRepository`, `XMapper`.
2) Controller rules
   - Use `@RestController` and `@RequestMapping("/[feature-plural]")`.
   - Methods return `ApiResponse<T>` (no raw returns).
   - Validate `@Valid @RequestBody` on inputs.
3) Service rules
   - Use `@Service`, `@RequiredArgsConstructor`, `@Transactional` on mutating methods.
   - No direct DB access in controllers; repository only in services.
4) DTO & Mapper
   - Request DTOs have validation annotations and SCREAMING_SNAKE_CASE messages.
   - MapStruct mappers use `@Mapper(componentModel = "spring")` and ignore relationships/audit fields in `toEntity`.
5) Repository
   - Extends `JpaRepository<Entity, UUID>`.
   - Queries filter `soft_deleted = false` by default or use proper `findByIdAndSoftDeletedFalse` patterns.
6) Exception handling
   - Business errors throw `AppException(ErrorCode.XYZ, "message")`.
   - No raw stacktraces returned to clients; `GlobalExceptionHandler` handles `AppException`.
7) API & contracts
   - HTTP status and response envelope follow `docs/api-standards.md`.
   - OpenAPI annotations present for public endpoints.
8) Tests
   - Unit tests added for service logic; mapper tests exist if mapper has logic.
   - Integration tests present for significant flows (Controller→Service→Repo) if feature affects DB/state.
9) Security
   - Permissions mapped (AclEntry/Role) documented; endpoints protected.
   - For cookie-based JWT flows: CSRF usage validated in tests.
10) Misc
   - No secrets in `application.yaml` committed.
   - No BOM in Java sources.
   - Follow existing logging & correlation patterns (if any).

Output format
- Summary: pass/fail + brief description.
- Files reviewed: list with per-file verdict (OK / Minor / Major) and line-linked suggestions.
- Suggested minimal patches (apply_patch-ready diffs) for each issue.
- Final recommendation: approve / request changes / blocking.

If ambiguous behaviour (business rule missing): list the exact questions for product and propose one safe default with justification.
