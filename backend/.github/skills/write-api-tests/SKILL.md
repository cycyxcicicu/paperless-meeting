---
name: write-api-tests
description: "Hướng dẫn chi tiết để viết Integration/API tests cho Paperless Meeting, bám sát docs/api-standards.md và docs/test-strategy.md."
applyTo: "src/main/java/vn/acme/paperless_meeting/controller/**"
---

Mục đích

- Sinh tests end-to-end cho các REST endpoint quan trọng (Controller → Service → Repository) theo chuẩn của project.

Khi sử dụng

- Khi cần bảo đảm một API flow (ví dụ: tạo cuộc họp, mời người tham dự, mở phiên bỏ phiếu) hoạt động đúng với business rules.

Tiền điều kiện

- Đọc: `docs/api-standards.md`, `docs/test-strategy.md`, `docs/business-rules.md`.
- CI hỗ trợ Docker (Testcontainers) hoặc thỏa thuận fallback H2.
- Dependencies: JUnit5, Mockito, Testcontainers (MySQL), Spring Boot Test (project thường đã có sẵn).

Quy ước test (project-specific)

- Luôn dùng `ApiResponse<T>` khi assert body.
- Nếu test gọi endpoint thay đổi dữ liệu: sử dụng CSRF token nếu app dùng cookie-based JWT flow (gọi `/csrf` để lấy token hoặc simulate cookie/CSRF pair).
- Authentication: preferred — gọi `/auth/login` để nhận access token (TestRestTemplate/MockMvc). Nếu không muốn gọi login flow, generate token bằng `JwtTokenGenerator` bean trong test context (đánh dấu rõ trong test).
- DB: dùng Testcontainers MySQL để có parity; nếu không có Docker, document fallback H2 và rủi ro.

Steps (chi tiết)

1. Xác định acceptance criteria từ business rules
    - Mapped vào asserts: HTTP status, `ApiResponse.success`, `ApiResponse.code`, state change trong DB (repository assertions).

2. Chọn kiểu test
    - Nếu endpoint chỉ chuyển dữ liệu nội bộ không tương tác DB: `@WebMvcTest` + Mock service.
    - Nếu endpoint thay đổi DB hoặc logic phức tạp: Integration test với Testcontainers (`@SpringBootTest` + `@AutoConfigureMockMvc` + `@Testcontainers`).

3. Viết class skeleton

```java
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
public class MeetingControllerIT {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
        .withDatabaseName("test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }

    @Autowired
    MockMvc mockMvc;

    @Autowired
    MeetingRepository meetingRepository;

    // test cases...
}
```

4. Authentication & CSRF in test
    - Option A (login flow): perform `POST /auth/login` with test user to get access token; use header `Authorization: Bearer <token>` for requests.
    - Option B (generate token): Autowire `JwtTokenGenerator` and build token with test user's id/roles (document this approach in test comments).
    - For cookie-based auth: set cookie and include `X-CSRF-TOKEN` header (obtain via `/csrf` if necessary).

5. Assertions
    - Assert HTTP status per `docs/api-standards.md` (201 for create, 200 for read/update, 400 for validation, etc.).
    - Assert `$.success == true/false` and `$.code` values.
    - Assert DB state using repository (e.g., `assertTrue(meetingRepository.findById(id).isPresent())`).

6. Isolation & cleanup
    - Use `@Transactional` on tests where appropriate (beware: with Testcontainers and MockMvc there are caveats — prefer manual cleanup or recreate DB between tests if needed).
    - Keep tests deterministic (avoid time-dependent assertions unless stubbed).

7. Example test case (create meeting)

```java
@Test
void createMeeting_returns201_andPersists() throws Exception {
    String body = "{\"title\":\"Test meeting\",\"startTime\":\"2026-03-28T09:00:00\"}";

    mockMvc.perform(post("/meetings")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body)
            .header("Authorization", "Bearer " + obtainToken()))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.id").exists());

    assertTrue(meetingRepository.count() > 0);
}
```

8. PR checklist for API tests

- Test passes locally with `mvn test`.
- Use Testcontainers in CI; if CI cannot run Docker, include fallback instructions (H2) and mark risk in PR.
- Add mapper tests if mapping involved.
- Update `docs/test-strategy.md` only if adding new conventions.
- Ensure no secrets in test resources and no BOM in Java files.

Common pitfalls

- Not including CSRF when cookie-based authentication is used → 403.
- Relying on H2-specific SQL features when production uses MySQL.
- Flaky tests due to shared state; prefer isolated DB per test class or transactional rollbacks.

Assumptions to call out in PR

- CI supports Docker (Testcontainers). If not, state explicit fallback and acceptance by reviewers.
- Default pagination (`page=0,size=20`) used unless test specifies otherwise.

If cần, tôi có thể tạo ngay file test skeleton cho một endpoint cụ thể — cho tôi biết endpoint (method + path) và acceptance criteria.
