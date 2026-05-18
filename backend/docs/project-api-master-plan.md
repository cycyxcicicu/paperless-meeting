# PROJECT API MASTER PLAN

*Tạo ngày: 2026-05-14. Nguồn: Source code thực tế trong src/. Viết bằng tiếng Việt.*

---

## 1. Tổng quan source code hiện tại

- **Tech stack**: Java 21, Spring Boot 4.0.3, Spring Data JPA (Hibernate), Spring Security, MapStruct 1.6.3, Lombok, JJWT 0.13.0, MySQL, Springdoc OpenAPI 3.0.1
- **Package structure**: Layered (Controller → Service → Repository), chia thư mục con theo feature cho controller/service/mapper/dto; entity và repository để flat
- **Response format**: `ApiResponse<T>` với fields `success` (boolean), `code` (int), `message` (String), `data` (T). Phân trang dùng `PageResponse<T>`
- **Auth/Security**: JWT stateless, CSRF disabled, `JwtAuthenticationFilter`, public endpoints định nghĩa trong `PublicEndpoint` enum
- **BaseEntity**: `SoftDeletable` (isDeleted, deletedAt, deletedBy). Audit fields (createdAt, createdBy) khai báo phân tán trên từng entity
- **Roles hệ thống**: `SUPER_ADMIN`, `DEPARTMENT_ADMIN`, `USER`

**⚠️ Bug hiện tại**: `MeetingController` không set `success(true)` khi dùng Builder → FE nhận `success=false`. Helper `ApiResponse.success()` hardcode `code=67`.

---

## 2. Danh sách entity hiện có (37 entity)

### Domain: Auth & User Management

| Entity | Table | Field chính | Quan hệ | Module |
|---|---|---|---|---|
| User | users | id, username, fullName, password, email, phone, status, isFirstLogin, avatar | → Role (M:1), → Department (M:1), → Position (M:1) | user |
| Role | roles | id, roleCode, roleName | ← RolePermission (1:N), ← User (1:N) | role |
| Permission | permissions | id, permCode, description | ← RolePermission (1:N) | permission |
| RolePermission | role_permissions | id | → Role (M:1), → Permission (M:1) | role |
| RefreshToken | (refresh_tokens) | id, token, expiryDate | → User (M:1) | auth |

### Domain: Organization

| Entity | Table | Field chính | Quan hệ | Module |
|---|---|---|---|---|
| Department | departments | id, deptName, code, status, email, phone | → parentDepartment (self M:1), ← User (1:N), ← Meeting (1:N) | department |
| Position | positions | id, positionName, positionCode, rankOrder, isLeadership | → Department (M:1) | position |
| Location | locations | id, name, address, roomCode, onlineLink, type, capacity | → Department (M:1), ← Meeting (1:N) | location |

### Domain: Meeting Core

| Entity | Table | Field chính | Quan hệ | Module |
|---|---|---|---|---|
| Meeting | meetings | id, title, status, startTime, endTime, checkinOpenAt, checkinCloseAt, lateAfterMinutes, cancelReason, rejectReason | → User/createdBy, → User/approvedBy, → Location, → Department | meeting |
| AgendaItem | agenda_items | id, title, content, orderNo, durationEst, status, prepDeadline | → Meeting (M:1), → User/ownerUser (M:1) | agenda |
| MeetingParticipant | meeting_participants | id, participantRole, inviteStatus, attendanceStatus, note | → Meeting (M:1), → User (M:1) | participant |
| MeetingInvitation | meeting_invitations | id, channel, sentAt, message, rsvpDeadline | → Meeting, → User/invitee, → User/invitedBy | invitation |
| AttendanceLog | attendance_logs | id, checkinTime, checkoutTime, method, status, lateMinutes, note | → Meeting, → User, → User/recordedBy | attendance |

### Domain: Document & Template

| Entity | Table | Field chính | Quan hệ | Module |
|---|---|---|---|---|
| Document | documents | id, title, docType, status, createdAt | → User/createdBy, → DocumentVersion/current, → Department/owner | document |
| DocumentVersion | document_versions | id, storageKey, fileUrl, fileName, fileSize, checksum, note | → Document (M:1), → User/createdBy | document |
| MeetingDocument | meeting_documents | id, usageType, requiredBeforeMeeting | → Meeting (M:1), → Document (M:1) | meeting-doc |
| DocTemplate | (doc_templates) | id, status, sourceType, templateType | → User/createdBy, → Department/owner, → Document/file | template |
| TemplateField | (template_fields) | id, fieldName, fieldType | → DocTemplate (M:1) | template |
| GeneratedDocument | (generated_documents) | id, status | → Meeting, → DocTemplate, → Document, → User/createdBy | template |
| DocumentAccessLog | (document_access_logs) | id, action, accessedAt | → Document, → DocumentVersion, → User | document |

### Domain: Motion & Voting

| Entity | Table | Field chính | Quan hệ | Module |
|---|---|---|---|---|
| Motion | motions | id, title, description, status | → Meeting, → AgendaItem, → User/createdBy | voting |
| VoteSession | vote_sessions | id, status, voteType, isAnonymous, allowChangeVote, quorumRequiredPct, passRule, passThresholdPct | → Motion, → Meeting, → User/createdBy | voting |
| VoteOption | (vote_options) | id, label, orderNo | → VoteSession (M:1) | voting |
| VoteEligibility | (vote_eligibilities) | id, weight | → VoteSession, → User | voting |
| VoteBallot | (vote_ballots) | id, submittedAt | → VoteSession, → User | voting |
| VoteBallotChoice | (vote_ballot_choices) | id | → VoteBallot, → VoteOption | voting |
| VoteResult | (vote_results) | id, totalEligible, totalVoted, quorumMet, passed | → VoteSession (1:1), → User/computedBy | voting |
| VoteResultOption | (vote_result_options) | id, voteCount, percentage | → VoteSession, → VoteOption | voting |

### Domain: Minutes

| Entity | Table | Field chính | Quan hệ | Module |
|---|---|---|---|---|
| Minutes | minutes | id, content, status, finalizedAt, versionNo | → Meeting, → User/createdBy | minutes |

### Domain: Approval Workflow

| Entity | Table | Field chính | Quan hệ | Module |
|---|---|---|---|---|
| ApprovalRequest | approval_requests | id, resourceType, resourceId, status, note | → User/requestedBy, ← ApprovalStep (1:N) | approval |
| ApprovalStep | approval_steps | id, stepNo, decision, decidedAt, comment | → ApprovalRequest, → User/approver, → Role/approverRole | approval |

### Domain: ACL (Access Control List)

| Entity | Table | Field chính | Quan hệ | Module |
|---|---|---|---|---|
| AclPrincipal | (acl_principals) | id, principalType | → User, → Department, → Role | acl |
| AclEntry | acl_entries | id, resourceType, resourceId, permissionCode, grantedAt, expiresAt | → AclPrincipal, → User/grantedBy | acl |

### Domain: System

| Entity | Table | Field chính | Quan hệ | Module |
|---|---|---|---|---|
| AuditLog | audit_logs | id, action, resourceType, resourceId, metaJson, retentionUntil | → User/actorUser | audit |
| Notification | notifications | id, type, content, channel, status, scheduledAt, sentAt, readAt | → User | notification |
| SpeakerQueue | (speaker_queues) | id, priority, status | → Meeting, → AgendaItem, → User | speaker |
| SpeakerTurn | (speaker_turns) | id, startedAt, endedAt, durationSec | → Meeting, → AgendaItem, → User, → SpeakerQueue | speaker |

---

## 3. Chia module/domain theo entity

| Module | Entity liên quan | Controller | Service | Repository | DTO | Mức độ hoàn thiện |
|---|---|---|---|---|---|---|
| **Auth** | RefreshToken, User | ✅ AuthController | ✅ AuthService | ✅ RefreshTokenRepo | ✅ LoginRequest, ChangePasswordRequest | **90%** — Đủ dùng |
| **User** | User | ✅ UserCrudController | ✅ UserService | ✅ UserRepository | ✅ UserCreateRequest, UserUpdateRequest, UserResponse | **90%** — Đủ dùng |
| **Department** | Department | ✅ DepartmentController | ✅ DepartmentService | ✅ DepartmentRepo | ✅ DepartmentUpsertRequest, DepartmentResponse | **90%** — Đủ dùng |
| **Position** | Position | ✅ PositionController | ✅ PositionService | ✅ PositionRepo | ✅ PositionUpsertRequest, PositionResponse | **90%** — Đủ dùng |
| **Location** | Location | ✅ LocationController | ✅ LocationService | ✅ LocationRepo | ✅ LocationUpsertRequest, LocationResponse | **90%** — Đủ dùng |
| **Role** | Role, RolePermission | ✅ RoleController | ✅ RoleService | ✅ RoleRepo | ✅ RoleUpsertRequest, RoleResponse | **85%** — Đủ CRUD |
| **Permission** | Permission | ✅ PermissionController | ✅ PermissionService | ✅ PermissionRepo | ✅ PermissionUpsertRequest, PermissionResponse | **85%** — Đủ CRUD |
| **Meeting** | Meeting | ✅ MeetingController | ✅ MeetingService | ✅ MeetingRepo | ✅ MeetingUpsertRequest, MeetingResponse | **70%** — Có bug ApiResponse, thiếu DELETE |
| **Participant** | MeetingParticipant | ❌ Chưa có | ❌ Chưa có | ✅ MeetingParticipantRepo | ✅ AddParticipantRequest, ParticipantResponse... | **30%** — Có DTO+Repo, thiếu Controller+Service |
| **Agenda** | AgendaItem | ❌ Chưa có | ❌ Chưa có | ✅ AgendaItemRepo (basic) | ❌ Chưa có | **15%** — Chỉ có Entity+Repo |
| **Document** | Document, DocumentVersion, MeetingDocument | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **10%** — Chỉ có Entity |
| **Voting** | Motion, VoteSession, VoteOption, VoteBallot... (7 entity) | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **5%** — Chỉ có Entity |
| **Minutes** | Minutes | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **5%** — Chỉ có Entity |
| **Approval** | ApprovalRequest, ApprovalStep | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **5%** — Chỉ có Entity |
| **Notification** | Notification | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **5%** — Chỉ có Entity |
| **AuditLog** | AuditLog | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **5%** — Chỉ có Entity |
| **ACL** | AclPrincipal, AclEntry | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **5%** — Chỉ có Entity |
| **Invitation** | MeetingInvitation | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **5%** — Chỉ có Entity |
| **Attendance** | AttendanceLog | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **5%** — Chỉ có Entity |
| **Speaker** | SpeakerQueue, SpeakerTurn | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **5%** — Chỉ có Entity |
| **Template** | DocTemplate, TemplateField, GeneratedDocument | ❌ Chưa có | ❌ Chưa có | ❌ Chưa rõ | ❌ Chưa có | **5%** — Chỉ có Entity |

---

## 4. API hiện có (đã implement trong Controller)

| Module | Method | Endpoint | Controller | Request DTO | Response DTO | Đủ cho FE? |
|---|---|---|---|---|---|---|
| Auth | POST | /auth/login | AuthController | LoginRequest | Void (token in cookie) | ✅ |
| Auth | POST | /auth/refresh | AuthController | — (cookie) | Void | ✅ |
| Auth | POST | /auth/logout | AuthController | — (cookie) | Void | ✅ |
| Auth | GET | /auth/me | AuthController | — | UserResponse | ✅ |
| Auth | POST | /auth/change-password | AuthController | ChangePasswordRequest | Void | ✅ |
| User | POST | /users/register | UserCrudController | UserCreateRequest | UserResponse | ✅ |
| User | GET | /users | UserCrudController | keyword, status, role, departmentId + Pageable | PageResponse\<UserResponse\> | ✅ |
| User | GET | /users/{id} | UserCrudController | — | UserResponse | ✅ |
| User | PUT | /users/{id} | UserCrudController | UserUpdateRequest | UserResponse | ✅ |
| User | DELETE | /users/{id} | UserCrudController | — | Void | ✅ |
| Department | GET | /departments | DepartmentController | — | List\<DepartmentResponse\> | ✅ |
| Department | GET | /departments/{id} | DepartmentController | — | DepartmentResponse | ✅ |
| Department | GET | /departments/{id}/children | DepartmentController | keyword + Pageable | PageResponse\<DepartmentResponse\> | ✅ |
| Department | POST | /departments | DepartmentController | DepartmentUpsertRequest | DepartmentResponse | ✅ |
| Department | PUT | /departments/{id} | DepartmentController | DepartmentUpsertRequest | DepartmentResponse | ✅ |
| Department | DELETE | /departments/{id} | DepartmentController | — | Void | ✅ |
| Position | GET | /positions | PositionController | — | List\<PositionResponse\> | ✅ |
| Position | GET | /positions/{id} | PositionController | — | PositionResponse | ✅ |
| Position | GET | /positions/department/{deptId} | PositionController | — | List\<PositionResponse\> | ✅ |
| Position | POST | /positions | PositionController | PositionUpsertRequest | PositionResponse | ✅ |
| Position | PUT | /positions/{id} | PositionController | PositionUpsertRequest | PositionResponse | ✅ |
| Position | DELETE | /positions/{id} | PositionController | — | Void | ✅ |
| Location | GET | /locations | LocationController | keyword, type, departmentId + Pageable | PageResponse\<LocationResponse\> | ✅ |
| Location | GET | /locations/{id} | LocationController | — | LocationResponse | ✅ |
| Location | POST | /locations | LocationController | LocationUpsertRequest | LocationResponse | ✅ |
| Location | PUT | /locations/{id} | LocationController | LocationUpsertRequest | LocationResponse | ✅ |
| Location | DELETE | /locations/{id} | LocationController | — | Void | ✅ |
| Role | GET | /roles | RoleController | — | List\<RoleResponse\> | ✅ |
| Role | GET | /roles/{id} | RoleController | — | RoleResponse | ✅ |
| Role | POST | /roles | RoleController | RoleUpsertRequest | RoleResponse | ✅ |
| Role | PUT | /roles/{id} | RoleController | RoleUpsertRequest | RoleResponse | ✅ |
| Role | DELETE | /roles/{id} | RoleController | — | Void | ✅ |
| Permission | GET | /permissions | PermissionController | — | List\<PermissionResponse\> | ✅ |
| Permission | GET | /permissions/{id} | PermissionController | — | PermissionResponse | ✅ |
| Permission | POST | /permissions | PermissionController | PermissionUpsertRequest | PermissionResponse | ✅ |
| Permission | PUT | /permissions/{id} | PermissionController | PermissionUpsertRequest | PermissionResponse | ✅ |
| Permission | DELETE | /permissions/{id} | PermissionController | — | Void | ✅ |
| Meeting | GET | /meetings | MeetingController | keyword, status, fromDate, toDate + Pageable | PageResponse\<MeetingResponse\> | ⚠️ Bug success=false |
| Meeting | GET | /meetings/{id} | MeetingController | — | MeetingResponse | ⚠️ Bug success=false |
| Meeting | POST | /meetings | MeetingController | MeetingUpsertRequest | MeetingResponse | ⚠️ Bug success=false |
| Meeting | PUT | /meetings/{id} | MeetingController | MeetingUpsertRequest | MeetingResponse | ⚠️ Bug success=false |
| Meeting | POST | /meetings/{id}/submit-approval | MeetingController | — | Void | ⚠️ Bug |
| Meeting | POST | /meetings/{id}/approve | MeetingController | — | Void | ⚠️ Bug |
| Meeting | POST | /meetings/{id}/reject | MeetingController | rejectReason (param) | Void | ⚠️ Bug |
| Meeting | POST | /meetings/{id}/cancel | MeetingController | cancelReason (param) | Void | ⚠️ Bug |
| Meeting | POST | /meetings/{id}/close | MeetingController | — | Void | ⚠️ Bug |
| — | — | MeetingStatusJob (cron) | — | — | — | ✅ Auto UPCOMING→IN_PROGRESS |

**Tổng: 42 API đã implement. Trong đó 9 API Meeting có bug response.**

---

## 5–7. Chia Plan triển khai (chi tiết)

> Xem file riêng: `docs/domain-module-roadmap.md`

---

## 8. Frontend Integration Contract

> Xem file riêng: `docs/frontend-integration-contract.md`

---

## 9. Kết quả

### File tạo/sửa:
1. `docs/project-api-master-plan.md` — File này (tổng quan toàn dự án)
2. `docs/domain-module-roadmap.md` — Chi tiết Plan 0→9 với 3 phương án A/B/C
3. `docs/frontend-integration-contract.md` — Mapping màn hình FE ↔ API

### Plan nên làm đầu tiên:
**Plan 0** (fix bug ApiResponse, ~30 phút) → **Plan 3** (Participant API, ~3 giờ, vì DTO/Repo đã có sẵn) → **Plan 2** (fix Meeting response, đi kèm Plan 0)

### Open Questions toàn dự án:
1. Phân quyền thêm/xóa Participant: ai được phép? (owner / DEPT_ADMIN / SUPER_ADMIN?)
2. Trạng thái Meeting cho phép sửa Participant: DRAFT+REJECTED+PENDING_APPROVAL+UPCOMING hay chỉ DRAFT+REJECTED?
3. Module Document: cần file upload thật (MinIO/S3) hay chỉ lưu URL?
4. Module Voting: có cần triển khai trong đợt này không, hay để sau?
5. Module Notification: In-app only hay cần email/SMS?
6. Module ACL: Có cần dùng ngay hay phân quyền hiện tại (role-based trong Service) là đủ?
7. Helper `ApiResponse.success(T)` sửa hardcode `67→200` luôn hay xóa method đi?
