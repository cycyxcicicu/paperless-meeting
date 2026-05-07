---
name: fix-bug-with-test
description: "Quy trình TDD để sửa bug: reproduce bằng test (unit hoặc integration), sửa minimal patch, thêm regression test, theo chuẩn dự án."
applyTo: "src/main/java/vn/acme_paperless_meeting/**"
---

Mục đích
- Hướng dẫn cụ thể để chuyển một stacktrace/bug report vào một sửa lỗi có kiểm chứng bằng test cho Paperless Meeting.

Nguyên tắc chính
- Always: reproduce the bug with a failing test before changing production code.
- Prefer minimal, behavior-preserving changes; follow `docs/coding-rules.md` (throw `AppException` with `ErrorCode` for business errors).
- For API-related fixes: adhere to `docs/api-standards.md` for status codes and `ApiResponse` envelope.
- For tests: follow `docs/test-strategy.md` (unit fast tests for service logic, Testcontainers for DB-level bugs).

Step-by-step
1) Parse the stacktrace
   - Identify exception type, message, and top in-repo stack frame (file, class, method, line). Open that file and surrounding methods.

2) Reproduce with a failing test
   - If bug is in service/business logic: write a unit test under `src/test/java/.../service/...` using Mockito to stub dependencies.
   - If bug involves DB/persistence/transactions: write an integration test with Testcontainers under `src/test/java/.../it` or `*IT.java` (Failsafe pattern recommended).
   - The test must fail locally before code changes.

3) Root cause analysis
   - Read `docs/business-rules.md` to confirm intended behaviour/state transitions.
   - Check validation: missing `@NotNull` or missing DTO validation can lead to NPEs or invalid states.
   - If DB constraint issue: confirm unique constraints and consider migration script (document in PR).

4) Implement minimal fix
   - For nulls: add explicit validation or `AppException(ErrorCode.INVALID_REQUEST, "...")` (do not swallow NPEs silently).
   - For logic errors: change logic in service layer (controllers should remain thin), mark mutating methods `@Transactional` when required.
   - For repository/query bugs: adjust JPQL/SQL and add repository test.

5) Add regression test(s)
   - Unit test for logic fix; integration test if DB/transaction behaviour changed.
   - Ensure test is deterministic and fast (unit) or stable (IT with Testcontainers).

6) Run full test suite and linting
   - `mvn -DskipTests=false clean test` locally.

7) PR content
   - Title: `[fix] <short description> — failing test added`
   - Body: include original stacktrace, failing test snippet, root cause, minimal patch, list of tests added, rollout notes (DB migration if any).

Developer guidelines & checks
- Do not add generic try/catch that hides underlying problem.
- Prefer `AppException(ErrorCode.XYZ, "message")` for business-level errors so `GlobalExceptionHandler` maps status/code properly.
- If fix changes business behaviour, update `docs/business-rules.md` and get product sign-off.
- If adding a new `ErrorCode`, follow existing enum patterns and map HTTP status appropriately.
- Ensure no BOM in edited Java files (Windows editors may introduce BOM causing javac errors).

Example: NullPointerException in MeetingService#create

1) Create unit test `MeetingServiceTest#create_whenNullTitle_thenAppException`

```java
@ExtendWith(MockitoExtension.class)
class MeetingServiceTest {
    @Mock MeetingRepository meetingRepository;
    @InjectMocks MeetingService meetingService;

    @Test
    void create_whenNullTitle_thenAppException() {
        MeetingUpsertRequest req = new MeetingUpsertRequest();
        req.setTitle(null);

        assertThrows(AppException.class, () -> meetingService.create(req));
    }
}
```

2) Implement minimal fix in `MeetingService#create`: validate request title and throw `AppException(ErrorCode.MEETING_TITLE_REQUIRED)`.

PR checklist for bug-fix with test
- Failing test included and verified failing.
- Minimal code change and tests now passing.
- If DB schema change required: include migration SQL and coordinate with ops.
- Update `docs/business-rules.md` if the behaviour changed or assumptions were clarified.
- Add explanation and stacktrace to PR description.

Assumptions
- CI supports Docker for ITs; if not, provide H2 fallback and clearly mark risk.
- Product owner will confirm business-rule changes when fix affects behaviour (e.g., RSVP rules, minutes finalization).

If bạn muốn, tôi có thể tạo test skeleton + minimal patch cho một stacktrace bạn dán vào đây.
