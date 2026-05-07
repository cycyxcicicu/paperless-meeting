# Write or Update Business Rules

**Purpose:** Document, clarify, or extend business rules for a feature or entity to ensure alignment between product requirements, domain model, and implementation.

## Pre-Writing Checklist

**DO NOT SKIP THIS SECTION.**

1. **Review Existing Business Rules**
    - Read `docs/business-rules.md` to understand the format and existing rules.
    - Check if the rule you want to document is already present.
    - If the rule is already documented but ambiguous, mark it for clarification request instead of re-writing.

2. **Clarify the Source**
    - Are these rules from **product requirements** (user stories, acceptance criteria)?
    - Are these rules **inferred from implementation** (existing code or entity model)?
    - Are these rules **newly discovered constraints** (from design meetings, domain experts)?
    - **DO NOT invent business rules without explicit source or product confirmation.**
    - If the source is informal (oral, Slack, email), confirm in writing with product/stakeholders before documenting.

3. **Inspect Related Code**
    - Find the entity class(es) relevant to the rule (under `src/main/java/.../entity/`).
    - Find any service classes that enforce or use the rule (under `src/main/java/.../service/`).
    - Find any DTOs or mappers related to the rule (under `src/main/java/.../dto/` and `mapper/`).
    - Identify any error codes or validation logic that already encodes the rule.
    - Document the current implementation state: complete, partial, missing, or conflicting.

4. **Check for Ambiguities**
    - Identify any terms or constraints that are unclear or have multiple interpretations.
    - List assumptions you are making about how the rule should work.
    - Note any edge cases or boundary conditions not covered by the rule.
    - Mark these for product clarification before finalizing the rule.

5. **Verify Consistency**
    - Does the rule conflict with any existing rules already documented?
    - Does the rule align with the system architecture (layered, ACL model, soft deletes, etc.)?
    - Does the rule respect the data model (entities, relationships, uniqueness constraints)?

6. **Plan Documentation (Required)**
    - Outline the **rule section** (entity, feature, or domain area it covers).
    - Outline the **rules themselves** (clear, actionable statements).
    - Outline any **clarification items** (ambiguities needing product input).
    - Request approval before writing the final documentation.

## Documentation Guidelines

1. **Use Clear, Unambiguous Language**
    - Write rules as factual statements, not questions or suggestions.
    - Use imperative mood where appropriate: "must", "shall", "may", "may not".
    - Avoid vague terms like "appropriate", "reasonable", "significant" without defining thresholds.
    - Example (ambiguous):
        ```
        The system should notify users appropriately when important events occur.
        ```
    - Example (clear):
        ```
        The system shall send an email notification to all participants when a meeting is scheduled
        or cancelled.
        Notifications are sent immediately upon scheduling and 1 hour before cancellation.
        ```

2. **Organize by Entity or Feature**
    - Group related rules under entity headings (e.g., ## Meeting, ## VoteSession).
    - Use sub-headings for complex features (e.g., ### Conditions, ### State Transitions, ### Permissions).
    - Example structure:

        ```
        ## Meeting

        - Entity: `Meeting` (primary key `meeting_id`).
        - Fields of interest: `title`, `start_time`, `status`.
        - Relationships: 1–N with `AgendaItem`, N–N with `User` via `MeetingParticipant`.

        ### Status Lifecycle

        - Meeting status follows the sequence: `draft` → `scheduled` → `ongoing` → `closed`.
        - Transitions can only occur in this order (no backward transitions).
        ...
        ```

3. **Define Constraints Explicitly**
    - State uniqueness constraints (e.g., "(meeting_id, user_id) is unique").
    - State optional vs required fields.
    - State valid value ranges or enumerations.
    - State referential constraints (foreign keys, cascades).
    - Example:
        ```
        Constraints:
        - `title` is required and must be 1–255 characters.
        - `status` is required and must be one of: `draft`, `scheduled`, `ongoing`, `closed`, `cancelled`.
        - `start_time` must be before `end_time`.
        - Primary key `meeting_id` is a UUID.
        - Uniqueness: `(department_id, meeting_date, start_time)` must be unique (no overlapping meetings per dept).
        ```

4. **Document State Transitions**
    - If an entity has multiple states, clearly define allowed transitions.
    - Use a state diagram or transition matrix format.
    - Example:

        ```
        ### Status Transitions

        |  From   | draft | scheduled | ongoing | closed | cancelled |
        |---------|-------|-----------|---------|--------|-----------|
        | draft | — | ✓ | ✗ | ✗ | ✓ |
        | scheduled | ✗ | — | ✓ | ✗ | ✓ |
        | ongoing | ✗ | ✗ | — | ✓ | ✗ |
        | closed | ✗ | ✗ | ✗ | — | ✗ |
        | cancelled | ✗ | ✗ | ✗ | ✗ | — |

        - Only a chair can transition a meeting from `draft` to `scheduled`.
        - A chair can cancel a meeting at any point (transition to `cancelled`).
        - The system automatically transitions a meeting from `scheduled` to `ongoing` when `start_time` is reached.
        ```

5. **Document Relationships**
    - Define cardinalities (1–1, 1–N, N–N).
    - Specify how deletions are handled (cascade, soft-delete, restrict).
    - Example:
        ```
        Relationships:
        - `Meeting` 1–N `AgendaItem`: One meeting has many agenda items.
          - Deletion: when a meeting is soft-deleted, related agenda items remain (soft delete only).
        - `User` N–N `Meeting` via `MeetingParticipant`: Users attend meetings; tracks role and attendance status.
          - Deletion: when a meeting is deleted, related participants are soft-deleted.
        ```

6. **Document Business Logic Rules**
    - Define validation rules, calculations, and workflows.
    - Be specific about triggers, conditions, and outcomes.
    - Example:

        ```
        ### Attendance & Check-In

        - Check-in window: defined by `meeting.checkin_open_at` and `meeting.checkin_close_at`.
        - Late threshold: if check-in occurs after `checkin_close_at + late_after_minutes`, participant is marked `late`.
        - Absence: if no check-in by `meeting.end_time`, participant is marked `absent`.
        - A participant may check in via QR, manual entry, GPS, or NFC (defined by `AttendanceLog.method`).
        - Manual check-in requires authorization (e.g., secretary or chair role).
        ```

7. **Mark Ambiguous or Missing Rules**
    - Use blockquotes to flag items needing product clarification.
    - Format: `> Needs clarification: [description]`.
    - Example:
        ```
        - Approval workflow:
          - An `ApprovalRequest` may have multiple `ApprovalStep` records.
          > Needs clarification: Do approval steps execute sequentially or in parallel?
          > Needs clarification: How are step outcomes (approved/rejected) aggregated into the request status?
        ```

8. **Include Implementation Notes**
    - Reference related classes, enums, or code patterns where applicable.
    - Identify existing error codes that enforce the rule.
    - Note where the rule is currently enforced (service, entity validation, DB constraint).
    - Example:
        ```
        Implementation:
        - Enforced by: `MeetingService.validateStatusTransition()` (throws `AppException` with `ErrorCode.INVALID_STATE_TRANSITION`).
        - Entity: `src/main/java/.../entity/Meeting.java` (status field).
        - Related error codes: `INVALID_STATE_TRANSITION`, `UNAUTHORIZED_ACTION`.
        ```

## Format Template

Use this structure as a starting point:

```markdown
# Business Rules — [Feature/Entity Name]

## [Entity Name]

- Entity: `[ClassName]` (primary key `field_name`).
- Fields of interest: `field1`, `field2`, `field3`.
- Relationships: [list 1–N, N–N, etc.]

### Constraints

- [constraint 1]
- [constraint 2]
- ...

### State Transitions (if applicable)

| From    | State A | State B | State C |
| ------- | ------- | ------- | ------- |
| State A | —       | ✓       | ✗       |
| State B | ✗       | —       | ✓       |
| State C | ✗       | ✗       | —       |

### Business Logic

- [rule 1]
- [rule 2]
- ...

### Implementation Notes

- Enforced by: [service class, entity validation, DB constraint]
- Related error codes: [ErrorCode enum values]
- Related entities/DTOs: [class names]

### Ambiguities / Clarifications Needed

> Needs clarification: [item 1]
> Needs clarification: [item 2]
```

## Validation Checklist

Before finalizing, verify:

- [ ] All rules are stated clearly and unambiguously.
- [ ] All rules are backed by product requirements or code inspection.
- [ ] All ambiguities are flagged with `> Needs clarification:`.
- [ ] All constraints (uniqueness, cardinality, optionality) are explicit.
- [ ] All state transitions (if applicable) are documented.
- [ ] All relationships are documented with cardinalities and deletion semantics.
- [ ] Related error codes and implementation points are referenced.
- [ ] No rules are invented; all are sourced or inferred from existing code.
- [ ] Format is consistent with existing rules in `docs/business-rules.md`.

## Output Format

Provide:

1. **Rule section** (entity/feature heading + outline).
2. **Full documentation** (formatted markdown matching the template above).
3. **Clarification requests** (list of items needing product input).
4. **Implementation impact** (which classes/tests will be affected).
5. **Notes** (assumptions, related rules, edge cases).

## Notes

- Do not commit business rules documentation without product approval.
- If a rule is ambiguous, request clarification in writing; do not guess.
- Use this document as the source of truth for implementation; ensure code matches documented rules.
- Update this document whenever business logic changes; keep it in sync with implementation.
- Review this document periodically (quarterly) to catch drift between written rules and actual implementation.
