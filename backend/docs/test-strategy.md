# Chiến lược kiểm thử (Test Strategy) — Paperless Meeting

Mục tiêu: đảm bảo sự ổn định của backend Paperless Meeting theo conventions hiện có (MapStruct, Lombok, Spring Boot, JWT, MySQL). Chiến lược này cụ thể cho repo và không viết chung chung.

1) Tổng quan các lớp kiểm thử
- Unit tests: kiểm tra logic tách rời trong service, validator, helper.
- Mapper tests: xác thực MapStruct mappings (dùng `Mappers.getMapper(...)`).
- Repository tests: kiểm tra query/JPA mappings (dùng `@DataJpaTest` hoặc Testcontainers MySQL để đảm bảo parity với production).
- Integration tests: `@SpringBootTest` + `MockMvc` hoặc `TestRestTemplate` để kiểm tra luồng controller→service→repository (cần chạy trên DB gần giống MySQL).
- Contract / E2E tests: chạy trên môi trường staging (không nằm trong pipeline unit tests thông thường).

2) Công cụ & thư viện khuyến nghị (dựa trên stack hiện có)
- JUnit 5 (Jupiter) — mặc định dự án sử dụng Maven + Java 21.
- Mockito — mock repository/service trong unit tests.
- Testcontainers (MySQL) — chạy integration/repository tests trên MySQL thực tế trong CI.
- Spring Boot Test, MockMvc, @DataJpaTest, TestEntityManager.

3) Nguyên tắc viết test
- Unit test chỉ test logic: mock dependency ngoài (repository, external services). Không khởi tạo Spring context để giữ tốc độ.
- Mapper test: instantiate mapper bằng MapStruct `Mappers.getMapper(MeetingMapper.class)` và kiểm tra mapping 2 chiều (request→entity, entity→response).
- Repository test: ưu tiên Testcontainers MySQL (parity). Nếu CI không hỗ trợ Docker, tạm chạy với H2 nhưng phải kiểm tra khác biệt SQL/DDL.
- Integration test: dùng `@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)` và `@AutoConfigureMockMvc` hoặc `TestRestTemplate`. Với JWT+CSRF, test cần tạo token hợp lệ (có thể gọi service `JwtTokenGenerator` trong test hoặc mock SecurityContext).

4) Cấu hình mẫu Testcontainers (MySQL)

```java
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
public class MeetingControllerIT {
    @Container
    public static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }

    @Autowired
    MockMvc mockMvc;

    // tests...
}
```

Gợi ý: thêm profile Maven cho integration tests sử dụng Failsafe plugin (pattern `**/*IT.java`) để tách khỏi unit tests.

5) Ví dụ skeleton test

- Unit service test (Mockito):

```java
@ExtendWith(MockitoExtension.class)
class MeetingServiceTest {
    @Mock
    MeetingRepository meetingRepository;

    MeetingMapper meetingMapper = Mappers.getMapper(MeetingMapper.class);

    @InjectMocks
    MeetingService meetingService; // hoặc new MeetingService(meetingRepository, meetingMapper)

    @Test
    void create_whenConflict_thenThrow() {
        when(meetingRepository.existsByTitleAndDepartmentId(...)).thenReturn(true);
        assertThrows(AppException.class, () -> meetingService.create(request));
    }
}
```

- Repository test (JPA):

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class MeetingRepositoryTest {
    @Autowired
    MeetingRepository meetingRepository;

    @Autowired
    TestEntityManager em;

    @Test
    void save_and_findById() {
        Meeting m = new Meeting(...);
        meetingRepository.save(m);
        assertTrue(meetingRepository.findById(m.getId()).isPresent());
    }
}
```

6) Kiểm thử bảo mật
- Test Authorization: tạo user test với role/permission và assert các endpoint protected trả 403/401 đúng.
- Với JWT+CSRF: gọi `/auth/login` (nếu tích hợp trong test) để lấy token, hoặc tạo token bằng `JwtTokenGenerator` bean trong test.

7) Dữ liệu test & isolation
- Test phải reset DB trạng thái giữa các case: dùng rollback của `@Transactional` cho unit/integration test, hoặc recreate schema cho repository tests.
- Tránh dùng dữ liệu môi trường chung. Prefab data: `src/test/resources/data/` chứa SQL hoặc builder class để tạo fixtures.

8) CI & local run
- Local: `mvn test` (chạy toàn bộ tests), `mvn -Dtest=MeetingServiceTest test` (chạy 1 test class), `mvn -Dtest=MeetingServiceTest#method test` (chạy 1 test method).
- CI: khuyến nghị bật Docker để dùng Testcontainers. Nếu CI không hỗ trợ Docker, cấu hình fallback sử dụng H2 và đánh dấu khác biệt trong PR.

9) PR checklist cho tests
- [ ] Viết unit tests cover happy path + ít nhất 1 lỗi business path.
- [ ] Mapper tested (2 chiều nếu có custom mapping logic).
- [ ] Nếu thay đổi repository/query: có repository test (DataJpaTest or IT).
- [ ] Integration test cho flow phức tạp (controller→service→repo) nếu feature tác động nhiều lớp.
- [ ] Chạy `mvn -DskipTests=false clean test` trước khi open PR.

10) Debugging & flaky tests
- Nếu flaky, xác định đầu vào không deterministic (time, random, external), cố gắng mock hoặc ổn định đầu vào.
- Sử dụng `@Testcontainers(reuse = true)` cẩn trọng; CI runner phải hỗ trợ.

11) Các tiêu chuẩn chất lượng
- Tập trung trên business logic: service-layer tests phải chiếm phần lớn code coverage.
- Không cố ép coverage % nếu đổi lại gây test fragile; ưu tiên tests có giá trị thay vì số.

---
Các giả định (nếu chưa có trong repo):
- CI runner hỗ trợ Docker cho Testcontainers. Nếu không, developer cần chấp nhận dùng H2 và bổ sung test matrix riêng.
- Hiện repo chưa có cấu hình Maven Failsafe; khuyến nghị tạo profile `integration-tests` nếu muốn tách ITs.
