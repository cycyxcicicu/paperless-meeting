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
              AND (
                (ar.resourceType = 'MEETING' AND EXISTS (
                    SELECT 1 FROM Meeting m 
                    WHERE m.id = ar.resourceId 
                      AND m.isDeleted = false 
                      AND m.status NOT IN ('CANCELLED', 'DRAFT', 'REJECTED')
                )) OR
                (ar.resourceType = 'DOCUMENT' AND EXISTS (
                    SELECT 1 FROM Document d 
                    WHERE d.id = ar.resourceId 
                      AND d.isDeleted = false 
                      AND d.status <> 'DRAFT'
                )) OR
                (ar.resourceType = 'MINUTES' AND EXISTS (
                    SELECT 1 FROM Minutes min 
                    WHERE min.id = ar.resourceId 
                      AND min.isDeleted = false 
                      AND min.status <> 'DRAFT'
                )) OR
                (ar.resourceType NOT IN ('MEETING', 'DOCUMENT', 'MINUTES'))
              )
            ORDER BY ar.requestedAt ASC
            """)
    java.util.List<ApprovalRequest> findAllPending(
            @Param("resourceType") ResourceType resourceType,
            @Param("status") ApprovalStatus status);
}
