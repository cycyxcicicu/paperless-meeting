# Pre-Flight Checklist

**Use this checklist before starting ANY coding task.** It ensures you avoid common pitfalls and maintain consistency with the codebase.

---

## Universal Checks (all tasks)

### 1. Do Not Invent Business Rules

**Rule:** If a behavior or constraint doesn't appear in `docs/business-rules.md` or visible in the existing code, **do not assume** — ask product.

**Acceptable sources for rules:**

- Documented in `docs/business-rules.md`
- Visible in existing code (entity validation, service checks, error codes)
- Confirmed by product via issue, email, or design doc

**Unacceptable sources:**

- "It seems like..." or "probably should be..."
- Verbal conversations not confirmed in writing
- Inference from partial code or comments

**Action if ambiguous:** Flag in `docs/business-rules.md` as `> Needs clarification:` and request product confirmation.

---

### 2. Review Existing Code Before Building

**Rule:** Reuse existing patterns. Don't invent your own.

**Checklist:**

- [ ] Found at least 1 existing module that does something similar (e.g., existing CRUD controller, existing service method, existing validator).
- [ ] Reviewed that module's:
    - [ ] Controller structure (annotations, response wrapping, error handling)
    - [ ] Service methods (transactional scope, error codes thrown)
    - [ ] DTOs (naming, validation annotations)
    - [ ] Mapper usage (ignored fields, custom mappings)
    - [ ] Repository queries (Spring Data naming vs @Query)
- [ ] Documented at least 2–3 patterns you'll replicate.

**Where to find examples:**

- Controllers: `src/main/java/vn/acme/paperless_meeting/controller/{feature}/`
- Services: `src/main/java/vn/acme/paperless_meeting/service/{feature}/`
- DTOs: `src/main/java/vn/acme/paperless_meeting/dto/{request,response}/{feature}/`
- Mappers: `src/main/java/vn/acme/paperless_meeting/mapper/{feature}/`

---

### 3. Verify Business Rules Alignment

**Rule:** Your change must respect documented domain constraints.

**Checklist:**

- [ ] Read relevant section(s) of `docs/business-rules.md`
- [ ] Identify constraints that apply (uniqueness, cardinality, state transitions, permissions)
- [ ] Confirm your implementation enforces them
- [ ] If a constraint is ambiguous, flag it (don't guess)

**Example:** If adding a meeting status update endpoint:

- [ ] Must verify allowed status transitions in `docs/business-rules.md`
- [ ] Must reject invalid transitions (throw AppException with INVALID_STATE_TRANSITION)
- [ ] Must respect any role/permission restrictions (chair only? secretary only?)

---

### 4. Check Error Codes

**Rule:** Reuse existing error codes. Only create new ones if truly needed.

**Checklist:**

- [ ] Read `src/main/java/vn/acme/paperless_meeting/exceptions/ErrorCode.java`
- [ ] Identified existing error codes that match your failure cases
- [ ] If creating new codes, justified each one (not for coding errors, only business exceptions)
- [ ] Each new ErrorCode has:
    - [ ] Unique numeric value
    - [ ] Clear English name (SCREAMING_SNAKE_CASE)
    - [ ] User-friendly message
    - [ ] Appropriate HTTP status (400/401/403/404/409/500)

**Example new code (requires justification):**

```java
MEETING_CHECKIN_CLOSED(3001, "Check-in window has closed", HttpStatus.BAD_REQUEST),
```

---

### 5. Check Cross-References

**Rule:** Identify all files that will be affected by your change.

**Checklist:**

- [ ] This method signature is called by: **_ service methods, _** controllers
- [ ] This DTO is used by: **_ controllers, _** services
- [ ] This mapper is used by: \_\_\_ services
- [ ] This repository method is called by: \_\_\_ services
- [ ] This entity change requires: **_ DTOs updated, _** mappers updated

**If many files affected:**

- [ ] Created a list of files to update
- [ ] Estimated time to coordinate changes
- [ ] Planned PR or multi-file commit to keep changes atomic

---

## Task-Specific Checklists

### Implementing a New REST Module

1. ✅ Complete "Universal Checks" above
2. Read [.github/prompts/create-module.prompt.md](../prompts/create-module.prompt.md) for workflow
3. Create file-by-file plan (paths + purpose)
4. Get approval on plan **before coding**

**See:** [.github/prompts/create-module.prompt.md](../prompts/create-module.prompt.md)

---

### Refactoring Service Logic

1. ✅ Complete "Universal Checks" above
2. Document the **problem:** what's broken or inadequate
3. Document the **solution:** what you'll change and why
4. Identify all methods that will be modified/added/removed
5. Get approval on plan **before refactoring**

**See:** [.github/prompts/refactor-service.prompt.md](../prompts/refactor-service.prompt.md)

---

### Adding a Custom JPA Query

1. ✅ Complete "Universal Checks" above (especially #3 and #4: business rules, error codes)
2. Search for similar queries in existing repositories
3. Determine: Spring Data naming or @Query annotation?
4. Design for performance:
    - [ ] Prevents N+1 queries (`LEFT JOIN FETCH` or `@EntityGraph` if has relationships)
    - [ ] Respects soft-delete filter (`soft_deleted = false`)
    - [ ] Uses pagination for large result sets (if applicable)
5. Plan query structure before writing JPQL/SQL
6. Write tests with realistic data volumes

**See:** [.github/prompts/create-jpa-query.prompt.md](../prompts/create-jpa-query.prompt.md)

---

### Analyzing Codebase (Inventory)

1. ✅ Complete "Universal Checks" (especially #2: review existing code)
2. Run discovery steps: controllers, services, entities, DTOs, mappers, repositories
3. Document findings in structured format (checklist, tables, or prose)
4. Identify gaps, incomplete modules, placeholders
5. Flag any unclear patterns or missing documentation

**See:** [.github/prompts/analyze-repo.prompt.md](../prompts/analyze-repo.prompt.md)

---

### Writing or Updating Business Rules

1. ✅ Complete "Universal Checks" above
2. Source verification:
    - [ ] Rule comes from product (confirmed in writing)
    - [ ] Rule inferred from existing code (cite specific files/lines)
    - [ ] Rule is a newly discovered constraint (flagged for product confirmation)
3. Check for ambiguities or conflicts with existing rules
4. Follow documentation format in `docs/business-rules.md`
5. Mark unclear items with `> Needs clarification:` for product input

**See:** [.github/prompts/write-business-rules.prompt.md](../prompts/write-business-rules.prompt.md)

---

## Red Flags (Stop & Ask)

If any of these apply, **STOP** and ask for clarification before proceeding:

- [ ] "The business rule isn't documented but I think it should work this way..."
- [ ] "I need to change a method signature that's called by 5+ places..."
- [ ] "This error should map to a new HTTP status that doesn't exist yet..."
- [ ] "I'm adding a private helper method that duplicates logic in another service..."
- [ ] "I need to add a new column to an entity that's used by multiple existing DTOs..."
- [ ] "The business rule seems to conflict with the design I'm implementing..."
- [ ] "I need to bypass the layered architecture (e.g., controller → repository directly)..."

**Action:** Document the issue, link to relevant files/rules, and request guidance before proceeding.

---

## Sign-Off

Before committing, confirm:

- [ ] ✅ Reviewed existing similar code
- [ ] ✅ Verified business rules (no invented rules)
- [ ] ✅ Used existing error codes (or justified new ones)
- [ ] ✅ Identified all cross-references and updated them
- [ ] ✅ No blocking red flags or ambiguities
- [ ] ✅ Tests written and passing
- [ ] ✅ Code follows `docs/coding-rules.md` patterns
- [ ] ✅ Ready for code review

**Questions?** See [.github/copilot-instructions.md](../copilot-instructions.md) for file guide or read [docs/coding-rules.md](../docs/coding-rules.md) for implementation patterns.
