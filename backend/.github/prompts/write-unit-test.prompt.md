# Prompt: Viết unit test cho Service / Mapper

Mục đích

- Sinh unit tests tập trung vào business logic trong `service` hoặc mapping logic trong mappers. Tuân theo `docs/test-strategy.md` và `docs/coding-rules.md`.

Đầu vào

- Full class under test (ví dụ `src/main/java/vn/acme/paperless_meeting/service/meeting/MeetingService.java`).
- Danh sách phương thức cần test và các trường hợp (happy path, invalid input, business error).
- Các dependency cần mock (repository, external services).

Yêu cầu viết test

1. Unit test (service layer)
    - Sử dụng `@ExtendWith(MockitoExtension.class)`.
    - Mock các dependency với `@Mock` và inject `@InjectMocks` cho service.
    - Test tên theo pattern: `methodName_condition_expectedResult`.
    - Kiểm tra both happy path và error path (dùng `assertThrows(AppException.class, () -> ...)`).
    - Nếu service cần user context, mock `SecurityContextHolder` hoặc stub helper `getCurrentActiveUser()`.

2. Mapper test
    - Dùng MapStruct mapper instance: `Mappers.getMapper(MeetingMapper.class)`.
    - Test mapping fields, đặc biệt custom expressions và nested fields.

3. Assertions & coding style
    - Dùng JUnit Jupiter assertions (`assertEquals`, `assertTrue`, `assertThrows`), hoặc AssertJ nếu project đã dùng.
    - Không mock class under test.

4. Test skeleton ví dụ (service)

```java
@ExtendWith(MockitoExtension.class)
class MeetingServiceTest {
    @Mock
    MeetingRepository meetingRepository;

    @Mock
    MeetingMapper meetingMapper;

    @InjectMocks
    MeetingService meetingService;

    @Test
    void create_whenTitleConflict_thenThrowAppException() {
        MeetingUpsertRequest req = ...;
        when(meetingRepository.existsByTitleAndDepartmentId(anyString(), any()))
            .thenReturn(true);

        assertThrows(AppException.class, () -> meetingService.create(req));
    }
}
```

5. File location & naming
    - `src/test/java/vn/acme/paperless_meeting/service/meeting/MeetingServiceTest.java`.

6. Outputs expected by the prompt
    - Full test class code for each requested test method.
    - If a failing behaviour found, propose the minimal change in production code and include a new/fixed unit test demonstrating the fix.

Assumptions

- Unit tests should run fast and not start Spring context. For integration tests, use `.github/prompts/write-integration-test.prompt.md`.
