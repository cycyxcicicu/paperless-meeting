package vn.acme.paperless_meeting.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.ApprovalRequest;
import vn.acme.paperless_meeting.entity.enums.ApprovalStatus;
import vn.acme.paperless_meeting.entity.enums.ResourceType;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, UUID> {

    Optional<ApprovalRequest> findFirstByResourceTypeAndResourceIdAndStatus(
            ResourceType resourceType,
            UUID resourceId,
            ApprovalStatus status);

    @Query("""
            SELECT ar FROM ApprovalRequest ar
            LEFT JOIN FETCH ar.requestedBy rb
            LEFT JOIN FETCH ar.approvalStepList aps
            LEFT JOIN FETCH aps.approverUser au
            LEFT JOIN FETCH aps.approverRole apr
            WHERE ar.id = :id
            """)
    Optional<ApprovalRequest> findDetailById(@Param("id") UUID id);

    @Query("""
            SELECT ar FROM ApprovalRequest ar
            LEFT JOIN FETCH ar.requestedBy rb
            LEFT JOIN FETCH ar.approvalStepList aps
            LEFT JOIN FETCH aps.approverUser au
            LEFT JOIN FETCH aps.approverRole apr
            WHERE ar.resourceType = :resourceType AND ar.resourceId = :resourceId
            ORDER BY ar.requestedAt DESC
            """)
    java.util.List<ApprovalRequest> findAllByResourceTypeAndResourceIdOrderByRequestedAtDesc(
            @Param("resourceType") ResourceType resourceType,
            @Param("resourceId") UUID resourceId);

    @Query("""
            SELECT ar FROM ApprovalRequest ar
            LEFT JOIN FETCH ar.requestedBy rb
            LEFT JOIN FETCH ar.approvalStepList aps
            LEFT JOIN FETCH aps.approverUser au
            LEFT JOIN FETCH aps.approverRole apr
            WHERE (:resourceType IS NULL OR ar.resourceType = :resourceType)
              AND ar.status = :status
            ORDER BY ar.requestedAt ASC
            """)
    java.util.List<ApprovalRequest> findAllPending(
            @Param("resourceType") ResourceType resourceType,
            @Param("status") ApprovalStatus status);
}
