# Create a Custom JPA Query

**Purpose:** Add a custom query method to a repository to support a specific business need, following Spring Data conventions and performance best practices.

## Pre-Query Checklist

**DO NOT SKIP THIS SECTION.**

1. **Review Existing Queries**
    - Check if a similar query already exists in the repository or a related repository.
    - Search the codebase for similar query patterns.
    - If a query can be achieved via Spring Data naming (e.g., `findByNameAndStatus`), use that; only use `@Query` for complex queries.

2. **Understand the Use Case**
    - Identify which service method needs this query.
    - Understand the input parameters and expected output.
    - Determine if pagination, sorting, or filtering is needed.
    - Check if the query should respect soft-delete (`soft_deleted = false`).

3. **Review Related Data Model**
    - Read the entity classes involved in the query (entities, relationships, lazy/eager loading).
    - Identify any relationships that may cause N+1 query problems (use `@Query` with `LEFT JOIN FETCH` if needed).
    - Check if the query will touch indexed columns (database design).

4. **Check Business Rules**
    - Confirm the query aligns with `docs/business-rules.md`.
    - Verify that the query logic reflects business constraints and relationships.
    - If the query encodes business logic (e.g., "active users only"), document that assumption.

5. **Plan Query (Required)**
    - Document the **query purpose** and **parameters**.
    - Outline the **SQL logic** (SELECT, FROM, WHERE, JOIN, ORDER BY, GROUP BY).
    - Specify **return type** (single entity, list, projection, DTO).
    - Request approval before writing JPQL or SQL.

## Query Design Guidelines

1. **Use Spring Data Naming for Simple Queries**
    - For single-entity lookups, prefer method names over `@Query`:

        ```java
        // GOOD: Spring Data naming
        Optional<Foo> findByNameAndDeptId(String name, UUID deptId);

        // ALSO GOOD: for readability on complex names, use @Query
        @Query("SELECT f FROM Foo f WHERE f.name = :name AND f.deptId = :deptId AND f.softDeleted = false")
        Optional<Foo> findActiveByNameAndDeptId(@Param("name") String name, @Param("deptId") UUID deptId);
        ```

2. **Use `@Query` for Complex Queries**
    - Multi-table joins, aggregations, subqueries, or JPQL/SQL specifics.
    - Always specify return type and parameter bindings.
    - Use named parameters (`:paramName`) instead of positional parameters for clarity.
    - Example:
        ```java
        @Query("""
            SELECT NEW vn.acme.paperless_meeting.dto.response.FooSummary(f.id, f.name, COUNT(b) as barCount)
            FROM Foo f
            LEFT JOIN f.bars b
            WHERE f.deptId = :deptId
            GROUP BY f.id, f.name
            ORDER BY f.createdAt DESC
            """)
        List<FooSummary> findSummariesByDeptId(@Param("deptId") UUID deptId);
        ```

3. **Handle Soft Deletes**
    - Always include `f.softDeleted = false` in WHERE clause unless explicitly querying deleted records.
    - Example:
        ```java
        @Query("""
            SELECT f FROM Foo f
            WHERE f.name = :name AND f.softDeleted = false
            """)
        Optional<Foo> findActiveByName(@Param("name") String name);
        ```

4. **Use Projections for Read-Heavy Queries**
    - If a query only needs specific fields, use a DTO projection instead of fetching full entities.
    - Reduces memory and improves performance.
    - Example:

        ```java
        public interface FooSummary {
            UUID getId();
            String getName();
            int getBarCount();
        }

        @Query("""
            SELECT NEW vn.acme.paperless_meeting.dto.response.FooSummary(f.id, f.name, COUNT(b))
            FROM Foo f
            LEFT JOIN f.bars b
            GROUP BY f.id, f.name
            """)
        List<FooSummary> findAllSummaries();
        ```

5. **Avoid N+1 Query Problems**
    - If the entity has relationships, use `LEFT JOIN FETCH` to eagerly load related entities.
    - Example (N+1 problem):
        ```java
        // BAD: causes N+1 queries (1 query to find foos, then N queries to load bars for each foo)
        @Query("SELECT f FROM Foo f WHERE f.deptId = :deptId")
        List<Foo> findByDeptId(@Param("deptId") UUID deptId);
        // ... then accessing f.getBars() inside a loop triggers a query per foo.
        ```
    - Example (fixed):
        ```java
        // GOOD: eager-loads bars in one query
        @Query("""
            SELECT DISTINCT f FROM Foo f
            LEFT JOIN FETCH f.bars
            WHERE f.deptId = :deptId
            """)
        List<Foo> findByDeptIdWithBars(@Param("deptId") UUID deptId);
        ```

6. **Use Pagination for Large Result Sets**
    - Return `Page<T>` or `Slice<T>` instead of `List<T>` when results may be large.
    - Accept a `Pageable` parameter.
    - Example:
        ```java
        @Query("""
            SELECT f FROM Foo f
            WHERE f.status = :status AND f.softDeleted = false
            """)
        Page<Foo> findByStatus(@Param("status") FooStatus status, Pageable pageable);
        ```

7. **Use `@Modifying` for INSERT/UPDATE/DELETE**
    - Mark mutating queries with `@Modifying` and `@Transactional`.
    - Return type is typically `int` (number of rows affected).
    - Example:
        ```java
        @Modifying
        @Transactional
        @Query("UPDATE Foo f SET f.status = :status WHERE f.deptId = :deptId AND f.softDeleted = false")
        int updateStatusByDeptId(@Param("status") FooStatus status, @Param("deptId") UUID deptId);
        ```

8. **Use Native SQL Only If Necessary**
    - Prefer JPQL for portability; use native SQL only for database-specific features (e.g., window functions, CTEs).
    - Mark native queries with `nativeQuery = true`.
    - Example:
        ```java
        @Query(value = """
            SELECT f.id, f.name, ROW_NUMBER() OVER (ORDER BY f.created_at DESC) as rn
            FROM foos f
            WHERE f.soft_deleted = false
            """, nativeQuery = true)
        List<Object[]> findWithRowNumbers();
        ```

9. **Document Query Rationale**
    - Add Javadoc to complex queries explaining the business logic and any assumptions.
    - Example:
        ```java
        /**
         * Finds all active Foos in a department, grouped by status with bar count.
         * Used by DashboardService to render the summary widget.
         *
         * @param deptId the department ID
         * @return list of summaries ordered by created_at DESC
         */
        @Query("""...""")
        List<FooSummary> findSummariesByDeptId(@Param("deptId") UUID deptId);
        ```

## Performance Checklist

- [ ] Query uses indexed columns in WHERE / JOIN conditions (check database schema).
- [ ] Query does not cause N+1 problems (uses JOIN FETCH for relationships).
- [ ] Query uses projections for read-heavy operations (not fetching full entities).
- [ ] Query respects soft-delete filter.
- [ ] Query uses pagination for large result sets.
- [ ] Query is tested with realistic data volumes.

## Testing Guidelines

1. **Unit Tests**
    - Use `@DataJpaTest` to test repository queries in isolation.
    - Create test data, execute queries, and verify results.
    - Test boundary conditions (empty result, single result, multiple results).
    - Example:
        ```java
        @DataJpaTest
        class FooRepositoryTest {
            @Autowired private FooRepository repo;
            @Autowired private TestEntityManager em;

            @Test
            void testFindActiveByName() {
                Foo active = new Foo("test", FooStatus.ACTIVE);
                Foo deleted = new Foo("test2", FooStatus.ACTIVE);
                deleted.setSoftDeleted(true);

                em.persistAndFlush(active);
                em.persistAndFlush(deleted);

                Optional<Foo> result = repo.findActiveByName("test");
                assertTrue(result.isPresent());
                assertEquals("test", result.get().getName());
            }
        }
        ```

2. **Integration Tests**
    - Test the query in the context of the service that uses it.
    - Verify that the service correctly processes query results.

3. **Query Performance Tests**
    - For complex queries, measure execution time with realistic data (1000+, 10000+ rows).
    - Verify that JOIN FETCH and pagination prevent N+1 queries.

## Output Format

Provide:

1. **Query purpose** (what business need it serves).
2. **Query design** (parameters, logic, return type).
3. **Repository method** (signature with `@Query` annotation).
4. **JPQL/SQL** (full query text, formatted for readability).
5. **Integration point** (which service method calls this query).
6. **Tests** (unit and performance tests).
7. **Notes** (assumptions, performance considerations, business rule alignments).

## Notes

- Always test queries with realistic data volumes.
- Document why a query exists (especially if it encodes business logic).
- If a query becomes complex (>50 lines), consider refactoring into a custom repository implementation using the Spring Data custom method pattern.
- Prefer derived query names when possible; they are self-documenting.
