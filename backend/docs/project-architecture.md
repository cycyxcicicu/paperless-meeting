# Project architecture — Paperless Meeting

This document summarizes the code structure and technical architecture based only on files present in the repository.

## 1. Project purpose

Based on the code and entities, this repository implements the backend for a "paperless meeting" system: it models and manages meetings, agenda items, participants/attendance, meeting documents, motions and vote sessions, users, roles and permissions, and approval/refresh-token support.

Key evidence: `src/main/java/vn/acme/paperless_meeting/entity/Meeting.java`, `AgendaItem.java`, `Minutes.java`, `Motion.java`, `VoteSession.java`, `Document.java`, `User.java`, `Role.java`, `Permission.java`.

## 2. Technologies detected

- Java 21 (see `pom.xml`).
- Spring Boot 4 (starter parent) with: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`.
- Spring Security (custom `SecurityConfig`, filters). See `src/main/java/vn/acme/paperless_meeting/config/security/SecurityConfig.java`.
- Hibernate / JPA (entities + `@SQLDelete`, `@SQLRestriction`).
- MapStruct for mapping and Lombok + `lombok-mapstruct-binding` for annotation processing.
- JWT via JJWT (`io.jsonwebtoken` 0.13.0) used by `JwtTokenGenerator` / `JwtTokenVerifier`.
- MySQL Connector/J (project configured for MySQL in `application.yaml`).
- OpenAPI: `springdoc-openapi-starter-webmvc-ui`.
- Jakarta Validation (`@Valid`) and Jakarta servlet APIs in controllers and filters.

See `pom.xml` and `src/main/resources/application.yaml` for versions and runtime config.

## 3. Package structure

- `vn.acme.paperless_meeting.controller` — REST controllers, grouped by feature (auth, meeting, user, role, permission, department, location, ...).
- `vn.acme.paperless_meeting.service` — service layer with business logic, auth helpers, filters, token services.
- `vn.acme.paperless_meeting.repository` — Spring Data JPA interfaces.
- `vn.acme.paperless_meeting.entity` — domain entities (many extend `entity.base.SoftDeletable`).
- `vn.acme.paperless_meeting.dto` — request/response DTOs and `dto/base/ApiResponse` envelope.
- `vn.acme.paperless_meeting.mapper` — MapStruct mappers.
- `vn.acme.paperless_meeting.config` — Spring configuration (security, CORS).
- `vn.acme.paperless_meeting.exceptions` — `AppException`, `ErrorCode`, `GlobalExceptionHandler`.

Examples: `src/main/java/vn/acme/paperless_meeting/controller/meeting/MeetingController.java`, `src/main/java/vn/acme/paperless_meeting/service/meeting/MeetingService.java`, `src/main/java/vn/acme/paperless_meeting/mapper/meeting/MeetingMapper.java`.

## 4. Security / authentication architecture

- Authentication method: JWT-based tokens (access + refresh) issued by `JwtTokenGenerator` and verified by `JwtTokenVerifier`.
- Token transport: Access token preferred from cookie (see `AuthCookieService` / `CookieUtil`) or `Authorization: Bearer ...` header. `JwtAuthenticationFilter` resolves token and sets `SecurityContext` per request.
- Refresh tokens: persisted as `RefreshToken` entity (`src/main/java/vn/acme/paperless_meeting/entity/RefreshToken.java`) with repository `RefreshTokenRepository` and used/rotated by `RefreshTokenService`.
- CSRF: cookie-backed CSRF tokens are issued and verified; there is a `/csrf` endpoint and `CookieCsrfTokenRepository` is used in `SecurityConfig`.
- Public endpoints are defined by `enums.PublicEndpoint` and allowed in `SecurityConfig` (e.g., `/auth/login`, `/auth/refresh`, `/csrf`, `/actuator/health`, swagger endpoints).
- Security errors and access-denied responses are converted into the project `ApiResponse` format by `SecurityExceptionHandlers`.

Uncertain: `spring-boot-starter-oauth2-resource-server` and `oauth2-client` are included in `pom.xml` but active OAuth2 flows are not visible in the scanned code — this may be unused or reserved for future work.

## 5. DTO / mapper / response / exception conventions

- Response envelope: `ApiResponse<T>` is the canonical response format with fields `success`, `code`, `message`, `data` (`src/main/java/vn/acme/paperless_meeting/dto/base/ApiResponse.java`). Controllers consistently return `ApiResponse` objects.
- Error handling: business errors use `AppException` carrying a `BaseErrorCode` (concrete enum `ErrorCode`) and are translated to HTTP responses by `GlobalExceptionHandler`.
- DTO naming: request DTOs follow `*UpsertRequest` / `*Request`; response DTOs follow `*Response` (e.g., `MeetingUpsertRequest`, `MeetingResponse`).
- Mapping: MapStruct mappers annotated with `@Mapper(componentModel = "spring")` convert DTOs ↔ entities; pattern is to ignore complex relations in create/update mappings (see `MeetingMapper`).
- Validation: controllers annotate request parameters with `@Valid` and `GlobalExceptionHandler` maps validation failures to `ErrorCode` values.

## 6. Key domain entities & data model

The project models the following core domain entities:

- **User / Department / Position**: organizational structure.
  - `User` has a current `Position` (M–1 relationship) and can be linked to multiple `Department`s via `UserDepartment`.
  - `Department` contains multiple `Position`s (1–N) and supports hierarchical structure (`parentDepartment`).
  - `Position` represents a job position/rank in a department (e.g., "Manager", "Staff") — **distinct from `Role` (authorization roles) and `MeetingParticipant.participantRole` (temporary role in a meeting).**
  - `UserDepartment` is a junction entity enabling N–N relationship between `User` and `Department` with metadata (`isPrimary`, `endDate`).

- **Meeting / Agenda / Participants**: core meeting workflow.
  - `Meeting` is the main entity with status (`DRAFT`, `PENDING_APPROVAL`, `UPCOMING`, `IN_PROGRESS`, `CLOSED`, `CANCELLED`, `REJECTED`). Trạng thái chuyển từ `UPCOMING` sang `IN_PROGRESS` được tự động hóa bằng Cron Job (`MeetingStatusJob`).
  - `AgendaItem` represents agenda items belonging to a meeting, ordered by `order_no`.
  - `MeetingParticipant` links `User` to `Meeting` with participant role (chair, secretary, member, guest), invite status, and attendance status.

- **Minutes / Documents / Approvals**: meeting documentation and controls.
  - `Minutes` records proceedings, versioned, with status (draft, submitted, approved, published).
  - `Document` and `DocumentVersion` manage file attachments and versioning.
  - `ApprovalRequest` and `ApprovalStep` implement approval workflows for documents and minutes.

- **Voting / Motions**: decision-making mechanisms.
  - `Motion` represents a proposal in a meeting.
  - `VoteSession` (opened from a `Motion`) collects votes with configurable rules (vote type, anonymous, quorum, pass threshold).
  - `VoteBallot` / `VoteOption` / `VoteResult` track votes, options, and outcomes.

- **Authorization model**: `Role` / `Permission` / `UserRoleScope` / `Scope` for role-based access control (RBAC).
  - `Role` is a named authorization role (e.g., "Admin", "Editor").
  - `Permission` is a fine-grained permission (e.g., "VIEW", "EDIT", "APPROVE").
  - `RolePermission` maps roles to permissions (N–N).
  - `UserRoleScope` assigns a role to a user within a scope (SYSTEM, DEPARTMENT, or MEETING).
  - `Scope` defines the boundary (system-wide, department-specific, or meeting-specific) for role application.

See `src/main/java/vn/acme/paperless_meeting/entity/` for entity definitions.

## 7. Implemented modules (observed)

- Auth: controllers and services for login/refresh/logout, JWT generation/verification, cookie helpers, CSRF endpoint (`controller/auth`, `service/auth`).
- User management: a `UserCrudController`, `UserService`, `UserRepository`, DTOs and mappers present. **Note**: `User` now has a `Position` field linking to the job position in a department.
- Meeting management: `MeetingController`, `MeetingService`, `Meeting` entity, mapper and repository implemented (create draft, update, schedule, cancel, find).
- Role, Permission, Department, **Position**, Location: controllers, services, DTOs, mappers and repositories are present.
- Refresh token storage: `RefreshToken` entity + repository.
- Many domain entities and repositories: vote-related repositories, document/template entities, attendance, approvals, etc., indicating data model coverage across meeting-related features.

Reference files: `src/main/java/vn/acme/paperless_meeting/service/meeting/MeetingService.java`, `src/main/java/vn/acme/paperless_meeting/controller/auth/AuthController.java`, `src/main/java/vn/acme/paperless_meeting/entity/RefreshToken.java`, `src/main/java/vn/acme/paperless_meeting/entity/Position.java`.

## 8. Incomplete or partially implemented modules (observed)

- `MeetingService` contains commented-out methods (status change) and helper methods that throw `UnsupportedOperationException` or return `null` (e.g., `getCurrentActiveUserOrNull()`). See `MeetingService` for `throw new UnsupportedOperationException("use getCurrentActiveUser() instead")` and `return null` occurrences.
- Some features appear implemented at repository/entity level but lack controllers or service endpoints (e.g., many vote-related repositories such as `VoteSessionRepository`, `VoteResultRepository` — controllers for voting may be incomplete or absent).
- Some controller methods are commented out (e.g., password change in `AuthController`).
- Project contains `.mvn/wrapper/maven-wrapper.properties` but `mvnw`/`mvnw.cmd` scripts are not present in the repository (operational gap for reproducible builds).

These gaps are derived from code presence/absence and inline comments; no assumptions beyond the visible code are made.

## 9. Likely next development steps (based on repository state)

- Implement controller/service endpoints for partially-implemented features (voting, document workflows) where repositories exist but endpoints are missing.
- Complete `MeetingService` helper methods or remove unused stubs; enable commented status-change API only after defining allowed transitions.
- Add integration tests for auth flows (login/refresh) and key controller endpoints (meetings, users) using an in-memory DB or testcontainers.
- Add or commit Maven wrapper scripts (`mvnw`, `mvnw.cmd`) if reproducible builds are required.
- Move secrets out of `application.yaml` into environment variables or externalized config (the JWT secret and DB password are present in `application.yaml`).

## 10. Technical risks or inconsistencies

- Production risk: `spring.jpa.hibernate.ddl-auto: update` (in `application.yaml`) will modify schema at runtime — acceptable for development but risky for production deployments.
- Secrets committed: `app.security.jwt-secret-base64` and DB credentials are present in `application.yaml` — these should be treated as sensitive and externalized.
- Platform requirements: project builds for Java 21 and relies on MapStruct/Lombok annotation processing — developer IDEs and CI must enable annotation processing and use JDK 21.
- Possible unused dependencies: OAuth2 client/resource-server dependencies exist in `pom.xml` but no OAuth2 code paths were found — this may cause confusion or unnecessary surface area.
- Editing risk on Windows: repository contains Java sources — be careful not to introduce UTF-8 BOM when rewriting Java files on Windows tools (observed warning pattern in repo guidance).

Uncertain items (callouts):

- Presence of OAuth2 dependencies does not necessarily mean OAuth flows are active; code scanned does not show OAuth2 controller usage.
- Runtime behaviour of JWT parsing/verification (JJWT usage) was not executed — token verification correctness is assumed from code but should be validated by tests or runtime checks.

---

Files referenced in this summary: `pom.xml`, `src/main/resources/application.yaml`, `src/main/java/vn/acme/paperless_meeting/config/security/SecurityConfig.java`, `src/main/java/vn/acme/paperless_meeting/service/auth/JwtTokenGenerator.java`, `src/main/java/vn/acme/paperless_meeting/service/auth/JwtTokenVerifier.java`, `src/main/java/vn/acme/paperless_meeting/service/auth/JwtAuthenticationFilter.java`, `src/main/java/vn/acme/paperless_meeting/dto/base/ApiResponse.java`, `src/main/java/vn/acme/paperless_meeting/exceptions/ErrorCode.java`, `src/main/java/vn/acme/paperless_meeting/exceptions/GlobalExceptionHandler.java`, `src/main/java/vn/acme/paperless_meeting/entity/User.java`, `src/main/java/vn/acme/paperless_meeting/entity/Department.java`, `src/main/java/vn/acme/paperless_meeting/entity/Position.java`, `src/main/java/vn/acme/paperless_meeting/entity/RefreshToken.java`, `src/main/java/vn/acme/paperless_meeting/service/meeting/MeetingService.java`.
