# Business Rules

This document restates the raw business rules provided for the Paperless Meeting system. Each rule is precise and implementation-friendly. If an item is ambiguous or open to interpretation it is marked with a short note:

> Needs clarification

---

## Meeting

- Entity: `Meeting` (primary key `meeting_id`).
- Fields of interest (explicit values): `title`, `description`, `start_time`, `end_time`, `status`.
    - Allowed `status` values: `draft`, `scheduled`, `ongoing`, `closed`, `cancelled`.
    - Optional/capability fields: `location_id`, `dept_id`, `checkin_open_at`, `checkin_close_at`, `late_after_minutes`, `cancel_reason` (nullable).
- Relationships:
    - `Meeting` 1–N `AgendaItem`.
    - `Meeting` N–N `User` via `MeetingParticipant`.
    - `Meeting` 1–N `MeetingInvitation`.
    - `Meeting` 1–N `AttendanceLog`.
    - `Meeting` N–N `Document` via `MeetingDocument`.
    - `Meeting` 1–N `Minutes` (the model allows multiple versions but business usage is typically one final minutes per meeting).
    - `Meeting` 1–N `Motion`, `VoteSession`, `SpeakerQueue`, `SpeakerTurn`, `GeneratedDocument`, `Scope`.

Notes / constraints:

- `cancel_reason` is nullable (the field exists and may be empty).
- `checkin_open_at` and `checkin_close_at` exist to define a check-in window; `late_after_minutes` defines the threshold to classify late arrivals.
    > Needs clarification: Exact enforcement rules for check-in outside the window, and whether late check-ins can be accepted after `checkin_close_at` are not specified.
- `Minutes` is modeled as 1–N but commonly used 1–1; record multiplicity vs business rule needs confirmation.
    > Needs clarification: whether multiple final `Minutes` records are permitted per meeting or only versions (and how finalization is enforced).

---

## User, Department, Position

- Entity: `User` (bảng `users`), `Department` (bảng `departments`), `Position` (bảng `positions`).
- Relationships:
  - `User` 1–N `UserDepartment`; `UserDepartment` N–N `Department` (một user có thể liên kết với nhiều phòng ban).
  - `User` has M–1 `Position`; `Position` M–1 `Department` (một user có một chức vụ hiện tại; mỗi chức vụ thuộc một phòng ban).
  - `Department` 1–N `Position` (một phòng ban chứa nhiều chức vụ).
  - `Department` 1–N `Department` (hỗ trợ phân cấp phòng ban: cha — con).

- `User` fields: `id`, `username`, `email`, `phone`, `fullName`, `status` (enum: ACTIVE, INACTIVE, SUSPENDED), `avatar`, `position_id` (khoá ngoài), `created_at`.

- `Department` fields: `id`, `deptName`, `parent_dept_id` (khoá ngoài, nullable cho departments cha), `is_deleted` (soft delete), `deleted_at`.

- `Position` fields: `id`, `positionName`, `positionCode`, `rankOrder`, `isLeadership` (boolean), `description`, `department_id` (khoá ngoài), `created_at`, `updated_at`.

- `UserDepartment` fields: `id`, `user_id`, `dept_id`, `isPrimary` (boolean, đánh dấu phòng ban chính), `endDate` (nullable, ngày kết thúc liên kết khi user rời phòng).

Rules & constraints:

- Mỗi `User` có một `Position` hiện tại (gán qua `position_id`).
- **Validation**: `position.department_id` phải **khớp** với `user` của `Position` đó (đơn vị của chức vụ phải là đơn vị của user).
    > Giả định: validation này cần được áp dụng tại service layer và/hoặc DB constraint.
- `UserDepartment.isPrimary` xác định phòng ban chính của user (có thể chỉ có tối đa một `isPrimary=true` per user).
    > Cần clarification: có enforce bắt buộc chỉ 1 primary department hay chỉ recommend?
- `UserDepartment.endDate` có thể null (user vẫn còn tại phòng) hoặc có giá trị (user đã rời phòng).
- `Department` hỗ trợ cấu trúc lồng nhau (`parent_dept_id`); không được phép tạo vòng lặp.

**Implementation note**: `Position.department_id` FK tồn tại trong code, nhưng `Department` chưa định nghĩa reverse `@OneToMany` mapping cho Position collection. Nếu muốn truy cập danh sách vị trí của một phòng gọi từ phía Department, cần thêm `List<Position> positionList` vào `Department` entity.

**Ghi chú quan trọng**: `Position` là **chức vụ công việc** (ví dụ: "Trưởng phòng", "Phó phòng", "Nhân viên"), **hoàn toàn khác với**:
  - `Role` (vai trò phân quyền hệ thống, ví dụ: "Admin", "Editor") — quản lý access control.
  - `MeetingParticipant.participantRole` (vai trò tạm thời trong cuộc họp, ví dụ: "chair", "secretary") — quản lý vai trò họp.

---

## Participant roles (and access model)

- `MeetingParticipant` associates a `User` with a `Meeting` and includes these fields:
    - `participant_role`: one of `chair`, `secretary`, `member`, `guest`.
    - `invite_status`: `invited`, `accepted`, `declined`, `tentative`, `no_response`.
    - `attendance_status`: `present`, `late`, `absent`, `excused`.
    - Uniqueness: `(meeting_id, user_id)` pair is unique.

- Role and permission model (entities): `Role`, `Permission`, `RolePermission`, `Scope`, `UserRoleScope`, `AclPrincipal`, `AclEntry`.
    - `Role` is an identifier with `role_name`.
    - `Permission` is an identifier with `perm_code`.
    - `RolePermission` maps roles to permissions (N–N).
    - `Scope` defines the scope of a role assignment: `SYSTEM`, `DEPARTMENT`, or `MEETING`. A `Scope` instance can reference a `dept_id` or a `meeting_id` when applicable.
    - `UserRoleScope` assigns a `role` to a `user` within a `scope` and records who assigned it and when.
    - `AclPrincipal` models a principal (user/role/department) referenced by `AclEntry`.
    - `AclEntry` grants a `permission_code` (e.g., `VIEW`, `DOWNLOAD`, `EDIT`, `SHARE`, `APPROVE`, `MANAGE`, `VIEW_RESULT`) on a specific resource (`resource_type`, `resource_id`) to an `AclPrincipal`.

Notes / constraints:

- `UserRoleScope` ties role assignment to a `Scope`; permissions applied to resources are expressed via `AclEntry` using `AclPrincipal` references.
    > Needs clarification: Priority/precedence rules when multiple `AclEntry` records apply (e.g., role-based vs user-specific grants) are not specified.
- `participant_role` values are enumerated but specific action permissions per role are not defined in the raw rules.
    > Needs clarification: Concrete permission maps (what `chair` may do vs `member`) are not provided and must be defined separately.

---

## Attendance / check-in

- `MeetingParticipant.attendance_status` has values: `present`, `late`, `absent`, `excused`.
- `AttendanceLog` captures `checkin_time`, `checkout_time`, `method` (`qr`, `manual`, `gps`, `nfc`), `status`, `late_minutes`, and `recorded_by` (nullable when user self-checks).
- `Meeting` provides `checkin_open_at` and `checkin_close_at` plus `late_after_minutes` to represent the check-in window and late threshold.

Rules and constraints:

- Each `AttendanceLog` references `meeting_id` and `user_id` and records the method and timestamps of the attendance event.
- `late_minutes` is recorded on the `AttendanceLog` when applicable.
- `MeetingParticipant` and `AttendanceLog` both express attendance state (`attendance_status` vs `status`). Implementations should keep these states consistent.
    > Needs clarification: Which record is the system of truth when `MeetingParticipant.attendance_status` and `AttendanceLog.status` differ and which writing operation updates the other.
- `rsvp_deadline` exists on `MeetingInvitation` to set an RSVP cutoff.
    > Needs clarification: Behavior for responses after `rsvp_deadline` (whether allowed, auto-declined, or flagged) is unspecified.

---

## Agenda

- `AgendaItem` fields: `agenda_id`, `meeting_id`, `title`, `content`, `order_no`, `duration_est`, `owner_user_id`, `prep_deadline`, `status`.
    - `status` values: `pending`, `in_progress`, `done`, `skipped`.
- Relationships: `AgendaItem` associates to `SpeakerQueue` / `SpeakerTurn` and optionally to `Motion` (nullable `agenda_id`).

Rules and constraints:

- `order_no` defines the agenda ordering within a meeting.
- `owner_user_id` indicates the user responsible for preparing or presenting the agenda item.
- `duration_est` is an estimated duration for the agenda item.
    > Needs clarification: Unit of `duration_est` (minutes/seconds) and enforcement policy when actual duration exceeds the estimate are not specified.
- `prep_deadline` indicates a recommended preparation cut-off for material related to the agenda item.

---

## Minutes

- `Minutes` fields: `minutes_id`, `meeting_id`, `created_by`, `content`, `status`, `finalized_at`, `version_no`.
    - `status` values: `draft`, `submitted`, `approved`, `published`.
- `Minutes` can relate to `ApprovalRequest` (approval workflow for minutes resources).

Rules and constraints:

- `created_by` is intended to be the secretary/recorder (the raw rule explicitly notes `created_by` is the secretary who creates minutes).
- `version_no` supports multiple versions of minutes.
- `finalized_at` marks the moment a minutes version becomes final.
    > Needs clarification: The exact lifecycle/transition rules (who may move `Minutes` from `draft` → `submitted` → `approved` → `published`, whether approved implies published automatically, and whether multiple published versions are allowed) are not specified.

---

## Approval

- `ApprovalRequest` represents a request to approve a resource (`resource_type` in {`DOCUMENT`, `MINUTES`}) with fields: `approval_id`, `resource_type`, `resource_id`, `requested_by`, `requested_at`, `status`, `note`.
    - Allowed `status` values: `pending`, `approved`, `rejected`, `cancelled`.
- `ApprovalStep` represents each step in the approval flow and contains `step_no`, `approver_user_id` or `approver_role_id`, `decision` (`pending`, `approved`, `rejected`), `decided_at`, and `comment`.

Rules and constraints:

- An `ApprovalRequest` may have multiple `ApprovalStep` records ordered by `step_no`.
- Each `ApprovalStep` must indicate either an explicit approver user or an approver role (the raw model allows both).
    > Needs clarification: Whether approval steps execute strictly sequentially (step 1 then step 2) or may execute in parallel is not specified.
    > Needs clarification: If `approver_role_id` is used, how the concrete user(s) within that role are chosen to take the step is not specified.
- `ApprovalRequest.status` reflects aggregate state based on its steps (pending → approved/rejected/cancelled).
    > Needs clarification: Rules for how step outcomes are aggregated into the `ApprovalRequest.status` (e.g., unanimity, majority, or first-decider) are not provided.

---

## Voting

- `VoteSession` fields: `vote_session_id`, `motion_id`, `meeting_id`, `created_by`, `opened_at`, `closed_at`, `status` (`scheduled`, `open`, `closed`, `cancelled`), `vote_type`, `is_anonymous`, `allow_change_vote`, `quorum_required_pct`, `pass_rule`, `pass_threshold_pct`, `min_choices`, `max_choices`.
    - `vote_type` values: `yes_no`, `yes_no_abstain`, `multiple_choice`.
    - `pass_rule` values: `simple_majority`, `two_thirds`, `custom`.
- `VoteOption` enumerates options per session.
- `VoteEligibility` marks whether each `User` is eligible for a `VoteSession` (contains `eligible` bool and `reason`).
- `VoteBallot` records a single user's ballot in a session and includes `user_id` (unique per `vote_session_id`), `cast_at`, `weight`, `is_valid`, `invalid_reason`.
- `VoteBallotChoice` links ballots to selected `VoteOption`(s) (supports 1 or multiple choices per ballot), effectively an N–N table between Ballot and Option.
- `VoteResult` summarizes the session: `total_eligible`, `total_cast`, `total_valid`, `passed` (bool), `computed_at`, `computed_by`.
- `VoteResultOption` stores per-option result (`vote_count`, `weight_sum`).

Rules and constraints:

- Each `VoteSession` may define whether results are anonymous via `is_anonymous` (affects display of `VoteBallot` → `user_id` exposure).
- `allow_change_vote` controls whether a user may change their ballot while the session is `open`.
- `quorum_required_pct` denotes the percentage of eligible voters required for quorum; `total_eligible` is tracked.
- `pass_rule` determines pass conditions; if `custom`, `pass_threshold_pct` applies.
    > Needs clarification: Precise computation for quorum (which eligible set applies), and exact application of `pass_rule` and `pass_threshold_pct` when `custom` is selected are not specified.
- `min_choices` / `max_choices` apply for `multiple_choice` vote_type to constrain how many options a ballot may select.
    > Needs clarification: Enforced behavior for ballots violating `min_choices`/`max_choices` (reject ballot, mark invalid, or trim) is not specified.
- `VoteBallot.weight` and `VoteResultOption.weight_sum` exist to support weighted voting.
    > Needs clarification: Source of `weight` (role-based, user attribute, or external) and weighting rules are not specified.
- `VoteBallot` must be unique per `(vote_session_id, user_id)`.

---

## Notifications

- Entity: `Notification` with fields `noti_id`, `user_id` (recipient), `type`, `content`, `channel` (`app`, `email`, `sms`), `scheduled_at`, `sent_at`, `status` (`pending`, `sent`, `failed`), `ref_type`, `ref_id`.
- The raw rules mention notification purposes: meeting invitations, preparation reminders, approval reminders, turn reminders, and similar in-meeting notifications.

Rules and constraints:

- Notifications are associated to a user via `user_id` and refer to a resource via `ref_type`/`ref_id`.
- `scheduled_at` represents when the notification is intended to be delivered; `sent_at` records actual send time.
    > Needs clarification: Precise triggers and retry/backoff policies for failed sends are not defined in the raw rules.

---

## Edge cases and constraints

- Uniqueness and referential constraints explicitly present in the model:
    - `(meeting_id, user_id)` in `MeetingParticipant` is unique.
    - `(vote_session_id, user_id)` ballot uniqueness is enforced (`VoteBallot`).
    - `RefreshToken.jti` is unique; `RefreshToken.token_hash` is unique.
- Relationship multiplicities to note:
    - `Meeting` → `Minutes` is modeled 1–N although business usage typically expects 1 final minutes per meeting.
    - `Document` → `DocumentVersion` is 1–N; `Document.current_version_id` points to the current version.
- ACL and permission scope:
    - `AclEntry` applies to resource types (`MEETING`, `DOCUMENT`, `MINUTES`, `VOTE_SESSION`) and is scoped to a principal via `AclPrincipal`.
    - `AclEntry` includes `expires_at` (optional) and a `granted_by` actor.
        > Needs clarification: Behavior when multiple ACLs apply to the same resource (conflicts, deny overrides, expiry precedence) is not specified.
- Templates and generated documents:
    - `DocTemplate` stores a `file_doc_id` (reference to a `Document`), `TemplateField` maps placeholders to source paths, and `GeneratedDocument` references the produced `Document` and stores `params_json`.
        > Needs clarification: Expected format for `params_json` and rules for template field substitution (missing optional fields, fallback behavior) are not provided.

---

## Implementation constraints explicitly called out by the raw model

- Password storage: use `password_hash` (the model explicitly states `password` should be stored as a hashed value).
- Unique identifiers: `user_id`, `dept_id`, `location_id`, `meeting_id`, etc., are primary keys for their respective entities.
- `User` fields with uniqueness constraints: `username` and `email` are unique.

---

## Summary of ambiguous items requiring product clarification

List of top ambiguities flagged in the raw rules (developers should request product answers before implementing):

- Minutes multiplicity and finalization rules for a meeting.
- Approval step execution model (sequential vs parallel) and aggregation logic for approval decision.
- Vote computation specifics: quorum calculation source set, `pass_rule` semantics for `custom`, ballot weight source, and behavior for ballots violating `min_choices`/`max_choices`.
- RSVP handling after `rsvp_deadline`.
- Priority / chair override semantics in `SpeakerQueue` and enforcement rules.
- ACL precedence when multiple `AclEntry` records apply to a resource.
- Notification triggers, retry/backoff, and failure handling policies.
- Template substitution `params_json` format and behavior for missing or incorrectly formatted fields.

---

If you want, I can now convert any of the above clarified rules into a concise checklist for implementation (APIs, validations, DB constraints, or tests) once you confirm answers for the ambiguous items.
