---
name: copilot-instructions
description: "Workspace instructions for the Paperless Meeting Spring Boot application. Quick start, project overview, and links to detailed documentation."
applyTo: "src/main/java/**, src/test/java/**, pom.xml, src/main/resources/**"
---

# Paperless Meeting — Copilot Instructions

**Purpose:** Help developers and AI assistants quickly get productive on this repository.

---

## Quickstart

### Build & Run

```bash
# Full build (compile + unit tests)
mvn clean package

# Build without tests
mvn -DskipTests clean package

# Run locally (dev mode)
mvn spring-boot:run

# Run from JAR
java -jar target/paperless-meeting-0.0.1-SNAPSHOT.jar

# Unit tests only
mvn test
```

### Key Requirements

- **Java 21** (see `pom.xml`)
- **MySQL 8.0+** (see `src/main/resources/application.yaml`)
- Maven 3.9+ (wrapper available but scripts `mvnw`/`mvnw.cmd` may need to be added)

---

## Project Overview

**What:** Backend for a paperless meeting system — manages meetings, participants, agendas, votes, documents, and approvals.

**Tech Stack:**

- Spring Boot 4, Spring Web, Spring Security
- Spring Data JPA / Hibernate with MySQL
- MapStruct for DTO mapping, Lombok for boilerplate
- JWT-based authentication (JJWT)
- OpenAPI/Swagger for API docs

**For detailed tech info:** See [docs/project-architecture.md](../docs/project-architecture.md)

---

## Project Layout

| Path                                                              | Purpose                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `src/main/java/vn/acme/paperless_meeting/controller/{feature}/`   | REST endpoints (grouped by feature: auth, meeting, user, role) |
| `src/main/java/vn/acme/paperless_meeting/service/{feature}/`      | Business logic, transactions, error handling                   |
| `src/main/java/vn/acme/paperless_meeting/repository/`             | Spring Data JPA interface definitions                          |
| `src/main/java/vn/acme/paperless_meeting/entity/`                 | JPA entities and domain models                                 |
| `src/main/java/vn/acme/paperless_meeting/dto/{request,response}/` | Request/response DTOs by feature                               |
| `src/main/java/vn/acme/paperless_meeting/mapper/`                 | MapStruct mappers (Entity ↔ DTO)                               |
| `src/main/java/vn/acme/paperless_meeting/exceptions/`             | `AppException`, `ErrorCode`, `GlobalExceptionHandler`          |
| `src/main/resources/application.yaml`                             | Database, JWT, cookie, CSRF config                             |

---

## Core Architecture Principles

### Layered (thin controllers, fat services)

```
HTTP Request → Controller (parse, validate)
             → Service (business logic, transactions)
             → Repository (database)
             ← Response (ApiResponse<T>)
```

**Never:** Controllers accessing repositories directly. Business logic staying in services.

### Error Handling (centralized)

- **Always** throw `AppException(ErrorCode.SOME_CODE, "message")` for business errors.
- **Never** create custom exception classes or return null.
- `GlobalExceptionHandler` auto-converts `AppException` to `ApiResponse` with HTTP status.

### Data Transfer (DTOs + MapStruct)

- Request DTOs: validate inputs (`@Valid` in controller).
- Response DTOs: build via MapStruct mappers from entities.
- MapStruct: configured with `componentModel = "spring"`.

For detailed naming and structure patterns: See [docs/coding-rules.md](../docs/coding-rules.md)

---

## Essentials Before Coding

**Read these first (in order):**

1. [docs/business-rules.md](../docs/business-rules.md) — domain constraints, relationships, state transitions
2. [docs/coding-rules.md](../docs/coding-rules.md) — naming conventions, code structure, when to use each pattern
3. [.github/PRE-FLIGHT-CHECKLIST.md](.github/PRE-FLIGHT-CHECKLIST.md) — universal checks for any task

**For workflows:**

- New REST module: [.github/prompts/create-module.prompt.md](.github/prompts/create-module.prompt.md)
- Refactor service: [.github/prompts/refactor-service.prompt.md](.github/prompts/refactor-service.prompt.md)
- Custom JPA query: [.github/prompts/create-jpa-query.prompt.md](.github/prompts/create-jpa-query.prompt.md)
- Analyze codebase: [.github/prompts/analyze-repo.prompt.md](.github/prompts/analyze-repo.prompt.md)

---

## Pitfalls & Technical Notes

### Secrets Management

- Database password, JWT secret in `application.yaml` are default/dev values.
- **Never commit real credentials.** Use environment variable overrides for prod.

### UTF-8 Encoding

- Do NOT edit Java files with tools that add UTF-8 BOM (Byte Order Mark).
- BOM breaks javac compilation. Use UTF-8 without BOM.

### Database Schema

- `hibernate.ddl-auto: update` in `application.yaml` mutates schema at startup.
- Fine for dev, **dangerous for production** (may drop columns unexpectedly).

### Soft Deletes

- Most entities extend `SoftDeletable` (soft_deleted flag, not hard delete).
- Queries must filter `soft_deleted = false` unless explicitly retrieving deleted records.
- See [docs/coding-rules.md#rules-for-adding-new-modules](../docs/coding-rules.md) for entity creation.

### Transactions & N+1 Queries

- Mark data-modifying service methods with `@Transactional`.
- Use `@EntityGraph` or `LEFT JOIN FETCH` to prevent N+1 query problems.
- See [docs/coding-rules.md](../docs/coding-rules.md#repository-method-naming) for repository patterns.

---

## Common Developer Tasks

### Add a New REST Endpoint

1. Read existing similar module (e.g., `controller/meeting/`, `service/meeting/`)
2. Check [docs/business-rules.md](../docs/business-rules.md) for constraints
3. Create file-by-file plan (entity, DTO, mapper, service, controller, tests)
4. Get approval on plan
5. Follow [docs/coding-rules.md](../docs/coding-rules.md) for structure
6. Use [.github/prompts/create-module.prompt.md](.github/prompts/create-module.prompt.md) workflow

### Fix a Bug in Service Logic

1. Read entire service class and identify all callers
2. Verify business rules in [docs/business-rules.md](../docs/business-rules.md)
3. Write failing tests first
4. Fix the bug, ensure all tests pass
5. Check cross-service impacts (may need coordination)

### Add a Custom Repository Query

1. Review similar queries in existing repositories
2. Understand the use case and expected output
3. Design query: Spring Data naming vs @Query annotation
4. Prevent N+1 queries: use `LEFT JOIN FETCH` or `@EntityGraph` for relationships
5. Add unit tests with realistic data
6. See [.github/prompts/create-jpa-query.prompt.md](.github/prompts/create-jpa-query.prompt.md)

---

## Questions? Ambiguities?

- **Architecture questions:** See [docs/project-architecture.md](../docs/project-architecture.md)
- **Domain/business questions:** See [docs/business-rules.md](../docs/business-rules.md) or flag ambiguities there
- **Code structure questions:** See [docs/coding-rules.md](../docs/coding-rules.md)
- **Task workflows:** See `.github/prompts/` directory

## Implementation patterns (follow these)

- MapStruct: mappers should use `@Mapper(componentModel = "spring")`. Reuse mappers where appropriate and follow the existing pattern of ignoring complex relations when creating/updating entities.
- DTO naming: request DTOs use `*UpsertRequest` / `*Request`; responses use `*Response`.
- Soft delete: entities extend `SoftDeletable` — follow its semantics for deletes/restores instead of hard-deleting unless explicitly required.
- Auth pattern: follow existing JWT + cookie + CSRF flow (`JwtTokenGenerator`, `JwtTokenVerifier`, `JwtAuthenticationFilter`, `RefreshTokenService`, `AuthCookieService`). New auth behavior must conform to these components.
- Error handling: throw `AppException(ErrorCode.SOME_CODE)`; add new `ErrorCode` entries only when truly needed and consistent with existing numbering ranges.

## File-by-file plan example (required before code)

- `src/main/java/vn/acme/paperless_meeting/controller/feature/FeatureController.java` — thin HTTP endpoints, request validation, call service.
- `src/main/java/vn/acme/paperless_meeting/service/feature/FeatureService.java` — business logic, `@Transactional` where needed.
- `src/main/java/vn/acme/paperless_meeting/repository/FeatureRepository.java` — JPA repository interfaces.
- `src/main/java/vn/acme/paperless_meeting/dto/request/FeatureUpsertRequest.java`
- `src/main/java/vn/acme/paperless_meeting/dto/response/FeatureResponse.java`
- `src/main/java/vn/acme/paperless_meeting/mapper/feature/FeatureMapper.java` — MapStruct mapper.
- `src/test/java/vn/acme/paperless_meeting/service/feature/FeatureServiceTest.java` — focused unit tests for business logic.

## Quick PR checklist

- Include the file-by-file plan in the PR description and mark any assumptions.
- Ensure annotation processing is enabled in the IDE (MapStruct + Lombok).
- Run `mvn -DskipTests clean package` to verify compilation and generated sources.
- Do not commit secrets (e.g., `app.security.jwt-secret-base64` in `application.yaml`). Use env overrides.

If you want, I can now generate a file-by-file plan for a specific feature — tell me the feature name and I will produce the plan before writing code.
