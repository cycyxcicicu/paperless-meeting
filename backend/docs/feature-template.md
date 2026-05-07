# Feature Template — Paperless Meeting

Hướng dẫn bắt buộc trước khi bắt tay vào hiện thực hoá một feature mới trong repo này. File-by-file plan là bắt buộc (xem `.github/copilot-instructions.md` trong repo).

1) Header (dán vào đầu issue / PR)
- Feature name: "<short-name>" (ví dụ: "Meeting voting: weighted votes")
- Owner: @dev
- Stakeholders / Reviewer: @pm, @architect
- Background / Why: <vì sao cần feature>

2) Acceptance criteria (Given / When / Then)
- AC1: Given ... When ... Then ...
- AC2: Given ... When ... Then ...

3) File-by-file plan (bắt buộc, theo convention project)
- `src/main/java/vn/acme/paperless_meeting/entity/<Feature>.java` — entity (UUID, extends `SoftDeletable` nếu cần).
- `src/main/java/vn/acme/paperless_meeting/repository/<Feature>Repository.java` — JPA repository.
- `src/main/java/vn/acme/paperless_meeting/dto/request/<feature>/<Feature>UpsertRequest.java` — request DTO + validation.
- `src/main/java/vn/acme/paperless_meeting/dto/response/<feature>/<Feature>Response.java` — response DTO.
- `src/main/java/vn/acme/paperless_meeting/mapper/<feature>/<Feature>Mapper.java` — MapStruct mapper (`componentModel = "spring"`).
- `src/main/java/vn/acme/paperless_meeting/service/<feature>/<Feature>Service.java` — service class, `@Transactional` on mutating methods.
- `src/main/java/vn/acme/paperless_meeting/controller/<feature>/<Feature>Controller.java` — REST endpoints, trả `ApiResponse<T>`.
- `src/test/java/...` — unit/mapper/repository/integration tests (tương ứng).
- `docs/business-rules.md` — bổ sung các business rules liên quan (trạng thái, transitions, permission mapping).

4) API surface (ví dụ)
- `POST /meetings/{meetingId}/votes` — tạo `VoteBallot` (body: `VoteBallotRequest`).
- `GET /meetings/{meetingId}/votes/result` — trả `VoteResultResponse`.

5) Security (Role/Permission)
- Liệt kê permissions mới cần tạo (ví dụ `VOTE_CREATE`, `VOTE_VIEW_RESULT`) và scope (MEETING/SYSTEM).
- Nếu cần, cập nhật `src/main/java/vn/acme/paperless_meeting/exceptions/ErrorCode.java` để thêm mã lỗi nghiệp vụ mới.

6) DB / Migration notes
- Nếu thay đổi schema (thêm column, table):
  - Tạo migration SQL (kế hoạch) — **Giả định**: hiện repo dùng `spring.jpa.hibernate.ddl-auto` cho dev; tuy nhiên production cần migration script (Flyway/Liquibase). Nếu repo chưa có Flyway, đưa SQL vào `docs/migrations/` và bàn với ops.

7) Tests
- Unit tests cho service logic + mapper tests.
- Repository tests cho query mới.
- Integration test cho end-to-end flow (MockMvc or Testcontainers MySQL).

8) OpenAPI & docs
- Thêm `@Operation`/`@Tag` cho các controller mới.
- Cập nhật `docs/business-rules.md` nếu feature thay đổi rules (state transitions, approvals, ...).

9) PR checklist
- [ ] Code compiles: `mvn -DskipTests=false clean package`.
- [ ] Unit tests passing locally.
- [ ] Mapper interfaces tested (MapStruct generated code validated).
- [ ] Business rules added/updated trong `docs/business-rules.md`.
- [ ] ErrorCode updated nếu cần (thêm entry vào `ErrorCode` enum).
- [ ] Security: permission mapping và test cases cho access control.
- [ ] Add integration test (if feature touches DB or security flows).
- [ ] Update OpenAPI annotations.

10) PR description template (copy vào PR body)

Title: `[feature] <short description>`

Description:

- Summary: ...
- Files changed: list important paths
- Business rules changed: yes/no — if yes, point to `docs/business-rules.md` section
- Test plan: unit + integration details
- Rollout/Backout plan: how to enable/disable new behavior if needed

11) Rollout & backward compatibility
- Nếu thay đổi contract: tạm thời tạo endpoint versioned (`/v2/...`) hoặc thêm feature flag.

12) Quick examples (controller pattern — bắt buộc tuân theo coding rules)

```java
@RestController
@RequestMapping("/meetings/{meetingId}/votes")
@RequiredArgsConstructor
public class VoteController {
    private final VoteService voteService;

    @PostMapping
    public ApiResponse<VoteResponse> cast(@PathVariable UUID meetingId, @Valid @RequestBody VoteRequest req) {
        return ApiResponse.<VoteResponse>builder()
                .success(true)
                .message("Bỏ phiếu thành công")
                .data(voteService.cast(meetingId, req))
                .build();
    }
}
```

13) Các giả định (nếu chưa có trong repo)
- Không có hệ thống migration tiêu chuẩn — nếu cần migration production, hãy đồng bộ với ops/architect.
- Logging/correlation-id: project chưa chuẩn hoá header `X-Request-Id`; nếu cần, đề xuất trước khi implement cross-cutting changes.

---
Áp template này khi mở issue/PR mới để reviewer dễ duyệt và developer có checklist thực tế.
