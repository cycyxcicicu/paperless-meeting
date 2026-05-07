# Prompt: Tạo DTO + MapStruct mapper

Mục đích
- Sinh request/response DTO và MapStruct mapper tương ứng, tuân thủ `docs/coding-rules.md` và style repository.

Đầu vào
- Tên feature (ví dụ `meeting`).
- Entity class (đường dẫn `src/main/java/.../entity/Meeting.java`) — nếu không có, liệt kê trường cần thiết và kiểu.
- Trường cần expose trong Response (ví dụ: id, title, startTime, departmentId, departmentName).

Hướng dẫn chi tiết
1) Request DTO (`*UpsertRequest`)
   - Đặt tại `src/main/java/vn/acme/paperless_meeting/dto/request/{feature}/`.
   - Sử dụng Lombok `@Getter @Setter`.
   - Áp validation annotations: `@NotBlank(message = "FIELD_REQUIRED")`, `@Size`, `@Email`... (messages theo SCREAMING_SNAKE_CASE phù hợp `ErrorCode`).
   - Không chứa trường như `id`, `createdAt`, `updatedAt` (trừ trường cập nhật cần thiết).

2) Response DTO (`*Response`)
   - Đặt tại `src/main/java/vn/acme/paperless_meeting/dto/response/{feature}/`.
   - Dùng `@Getter @Builder` để immutable output.
   - Tên trường camelCase.

3) MapStruct mapper
   - File `src/main/java/vn/acme/paperless_meeting/mapper/{feature}/{Feature}Mapper.java`.
   - `@Mapper(componentModel = "spring")`.
   - Methods: `toEntity(FeatureUpsertRequest)`, `toResponse(Feature entity)`, `toResponseList(List<Feature>)`.
   - `@Mapping(target = "id", ignore = true)` on toEntity. Ignore audit/relationship fields that are handled in service.
   - For nested names, use `@Mapping(target = "departmentName", expression = "java(entity.getDepartment()!=null ? entity.getDepartment().getName() : null)")`.

4) Mapper test
   - Place under `src/test/java/.../mapper/...`.
   - Use `Mappers.getMapper(FeatureMapper.class)`.
   - Test both directions when mapping logic non-trivial (e.g., mapping nested fields, custom expressions).

5) Examples

Request DTO example:

```java
@Getter
@Setter
public class MeetingUpsertRequest {
    @NotBlank(message = "MEETING_TITLE_REQUIRED")
    @Size(max = 255, message = "MEETING_TITLE_INVALID")
    private String title;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private UUID departmentId;
}
```

Mapper example:

```java
@Mapper(componentModel = "spring")
public interface MeetingMapper {
    @Mapping(target = "id", ignore = true)
    Meeting toEntity(MeetingUpsertRequest request);

    @Mapping(target = "departmentName", expression = "java(entity.getDepartment()!=null ? entity.getDepartment().getName() : null)")
    MeetingResponse toResponse(Meeting entity);

    List<MeetingResponse> toResponseList(List<Meeting> entities);
}
```

Assumptions
- Nếu entity có quan hệ phức tạp, mapping phải giữ minimal logic; relation resolution/doSave relation do ở service layer.

Output
- Trả về: 1) nội dung 2 file DTO (request/response), 2) mapper interface, 3) unit test skeleton cho mapper.
