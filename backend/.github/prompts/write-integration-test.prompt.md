# Prompt: Viết integration test (Controller → Service → Repository)

Mục đích
- Tạo integration test end-to-end cho các flow quan trọng, chạy trên Spring context và MySQL Testcontainers (theo `docs/test-strategy.md`).

Đầu vào
- Endpoint cần test (ví dụ: `POST /meetings`).
- Acceptance criteria (expected DB state, response body, status code).

Hướng dẫn thực hiện
1) Test class cấu hình
   - `@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)` hoặc `@AutoConfigureMockMvc`.
   - Kết hợp Testcontainers MySQL: khai báo `@Container public static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")...` và `@DynamicPropertySource` để gán `spring.datasource.*`.

2) Security
   - Nếu endpoint yêu cầu auth: lấy token bằng cách gọi `/auth/login` trong test (preferred) hoặc generate token sử dụng `JwtTokenGenerator` bean.
   - Nếu dùng cookie-based JWT, kèm CSRF token khi gọi endpoint thay đổi dữ liệu (`X-CSRF-TOKEN`).

3) Tests flow
   - Chuẩn bị dữ liệu (insert entities hoặc gọi repository trực tiếp).
   - Call endpoint (MockMvc hoặc TestRestTemplate) với headers cần thiết.
   - Assert response (status + ApiResponse body), assert DB state bằng repository.

4) Cleanup & isolation
   - Dùng `@Transactional` + rollback cho mỗi test hoặc truncate các bảng giữa tests.

5) Example skeleton

```java
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class MeetingControllerIT {
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0").withDatabaseName("test").withUsername("test").withPassword("test");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", mysql::getJdbcUrl);
        r.add("spring.datasource.username", mysql::getUsername);
        r.add("spring.datasource.password", mysql::getPassword);
    }

    @Autowired
    MockMvc mockMvc;

    @Autowired
    MeetingRepository meetingRepository;

    @Test
    void postMeeting_createsMeetingAndReturns201() throws Exception {
        String body = "{ \"title\": \"Test\", \"startTime\": \"2026-03-28T09:00:00\" }";

        mockMvc.perform(post("/meetings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .header("Authorization", "Bearer " + obtainToken()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true));

        assertTrue(meetingRepository.count() > 0);
    }
}
```

6) Output của prompt
   - Toàn bộ lớp test với config Testcontainers + 1-2 test cases theo acceptance criteria.

Assumptions
- CI runner hỗ trợ Docker cho Testcontainers; nếu không, provide alternative using in-memory DB (H2) and note risk of SQL differences.
