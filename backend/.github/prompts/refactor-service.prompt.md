# Refactor Service Logic

**Purpose:** Improve, fix, or extend a service method while maintaining the layered architecture and consistency with the existing codebase.

## Pre-Refactoring Checklist

**DO NOT SKIP THIS SECTION.**

1. **Understand Current Implementation**
    - Read the entire service class, not just the method being refactored.
    - Identify all callers of the method (via code search).
    - Review related tests (unit and integration).
    - Understand the current transaction boundaries and error handling.

2. **Identify Related Modules**
    - Determine which DTOs, entities, mappers, and repositories this method uses.
    - Read their implementations to understand dependencies and patterns.
    - Note any related service methods in other services.

3. **Review Business Rules**
    - Check `docs/business-rules.md` for constraints, relationships, and state transitions relevant to the refactored logic.
    - If the current implementation violates a business rule, flag it.
    - If you are changing business behavior, request explicit approval.
    - **DO NOT invent business rules.**

4. **Audit Error Handling**
    - Identify all error codes thrown by the current method.
    - Check if the error codes align with the domain logic.
    - If you are adding or changing error codes, justify each one.

5. **Plan Refactoring (Required)**
    - Document the **problem statement**: what is broken or inadequate in the current implementation.
    - Document the **solution**: what changes will you make and why.
    - List all methods that will be **modified**, **added**, or **removed**.
    - Request approval before proceeding.

## Refactoring Guidelines

1. **Preserve Existing Contracts**
    - Do not change the method signature unless unavoidable (and update all callers).
    - Do not change the return type (if that requires breaking callers, refactor incrementally).
    - Maintain backward compatibility at the API layer.

2. **Maintain Transaction Scope**
    - If adding database operations, ensure they are within the same `@Transactional` boundary.
    - If adding calls to other services, be aware of their transaction scope (may nest or propagate).
    - Do not introduce unnecessary transaction splitting.

3. **Improve Error Handling**
    - Replace generic `RuntimeException` or `return null` with specific `AppException(ErrorCode.*)`.
    - Validate inputs early.
    - Provide clear, actionable error messages.
    - Ensure all code paths are covered by error handling.
    - Example (before):
        ```java
        public Foo getFoo(UUID id) {
            return fooRepository.findById(id).orElse(null);  // BAD: returns null
        }
        ```
    - Example (after):
        ```java
        public Foo getFoo(UUID id) {
            return fooRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Foo not found"));
        }
        ```

4. **Enhance Validation**
    - Add pre-condition checks before repository operations.
    - Validate state transitions (e.g., status changes must follow allowed rules).
    - Use DTOs with `@Valid` validation at the controller; service can assume valid inputs.
    - Example:
        ```java
        public void updateFooStatus(UUID id, FooStatus newStatus) {
            Foo foo = getFoo(id);  // throws if not found
            if (!isValidStatusTransition(foo.getStatus(), newStatus)) {
                throw new AppException(ErrorCode.INVALID_STATE_TRANSITION,
                    "Cannot transition from " + foo.getStatus() + " to " + newStatus);
            }
            foo.setStatus(newStatus);
            fooRepository.save(foo);
        }
        ```

5. **Extract Helper Methods**
    - If business logic is complex or repeated, extract into private helper methods.
    - Name helpers clearly (e.g., `isValidStatusTransition`, `calculateDeadline`, `checkPermissions`).
    - Keep methods focused and testable.

6. **Respect Mapper Patterns**
    - Use mappers for entity ↔ DTO conversions, not manual field copying.
    - If a mapper conversion is incomplete, extend the mapper rather than duplicating logic in the service.

7. **Update Documentation**
    - Add or update Javadoc for modified methods.
    - Document assumptions, constraints, and exceptions thrown.
    - Example:
        ```java
        /**
         * Updates the status of a Foo.
         *
         * @param id the Foo ID
         * @param newStatus the new status (must be a valid transition from current status)
         * @throws AppException with ErrorCode.RESOURCE_NOT_FOUND if foo not found
         * @throws AppException with ErrorCode.INVALID_STATE_TRANSITION if transition is not allowed
         */
        public void updateFooStatus(UUID id, FooStatus newStatus) { ... }
        ```

## Testing Guidelines

1. **Unit Tests**
    - Test all branches of the refactored logic.
    - Test positive cases, error cases, and edge cases.
    - Mock dependencies (repositories, other services).
    - Verify correct error codes are thrown.
    - Example:
        ```java
        @Test
        void testUpdateFooStatusInvalidTransition() {
            Foo foo = new Foo();
            foo.setStatus(FooStatus.CLOSED);
            when(fooRepository.findById(id)).thenReturn(Optional.of(foo));

            AppException ex = assertThrows(AppException.class,
                () -> fooService.updateFooStatus(id, FooStatus.DRAFT));
            assertEquals(ErrorCode.INVALID_STATE_TRANSITION, ex.getErrorCode());
        }
        ```

2. **Integration Tests**
    - If refactoring affects multiple layers, test end-to-end with the database.
    - Test the full request-response cycle via the controller.
    - Verify that error responses have the correct HTTP status and `ApiResponse` structure.

3. **Regression Tests**
    - Re-run all existing tests for the modified service.
    - Ensure no callers are broken by the changes.

4. **Update Test Coverage**
    - If new methods or branches are added, create corresponding tests.
    - Aim for >80% code coverage on refactored code.

## Refactoring Patterns

### Pattern 1: Replace Null Returns with Exceptions

**Problem:** Method returns `null` instead of throwing a checked exception.

```java
// BEFORE
public Foo get(UUID id) {
    return repo.findById(id).orElse(null);
}

// AFTER
public Foo get(UUID id) {
    return repo.findById(id)
        .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Foo not found"));
}
```

### Pattern 2: Extract Validation Logic

**Problem:** Validation logic is mixed with business logic.

```java
// BEFORE
public void update(UUID id, FooUpdateRequest req) {
    if (req.getName() == null || req.getName().isEmpty()) {
        throw new IllegalArgumentException("Name required");
    }
    Foo foo = repo.findById(id).orElseThrow(...);
    foo.setName(req.getName());
    repo.save(foo);
}

// AFTER
private void validateUpdateRequest(FooUpdateRequest req) {
    if (req.getName() == null || req.getName().isEmpty()) {
        throw new AppException(ErrorCode.INVALID_REQUEST, "Name is required");
    }
}

public void update(UUID id, FooUpdateRequest req) {
    validateUpdateRequest(req);
    Foo foo = getFoo(id);  // throws if not found
    foo.setName(req.getName());
    repo.save(foo);
}
```

### Pattern 3: Add Transaction Scope

**Problem:** Database operations occur without transactional guarantee.

```java
// BEFORE
public void bulkUpdate(List<UUID> ids, FooStatus status) {
    ids.forEach(id -> {
        Foo foo = repo.findById(id).orElse(null);  // loses transaction per iteration
        if (foo != null) {
            foo.setStatus(status);
            repo.save(foo);
        }
    });
}

// AFTER
@Transactional
public void bulkUpdate(List<UUID> ids, FooStatus status) {
    ids.forEach(id -> {
        Foo foo = getFoo(id);
        foo.setStatus(status);
        repo.save(foo);  // all saves are part of one transaction
    });
}
```

## Output Format

Provide:

1. **Problem statement** (what is broken or inadequate).
2. **Solution** (what changes will be made and why).
3. **File-by-file plan** (methods modified, added, or removed).
4. **Code diffs** (before and after for each method).
5. **Updated tests** (unit and integration tests).
6. **Notes** on any business rule clarifications needed or assumptions made.

## Notes

- Refactor incrementally; do not overhaul an entire service in one change.
- If a refactoring requires changes to multiple services, coordinate them in one PR.
- Always run the full test suite after refactoring.
- Document why the refactoring was necessary (for future audits and PR reviews).
