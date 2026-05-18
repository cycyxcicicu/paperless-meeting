package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.acme.paperless_meeting.entity.ApprovalStep;
import vn.acme.paperless_meeting.entity.enums.ApprovalDecision;

public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, UUID> {

    Optional<ApprovalStep> findFirstByApprovalRequestIdAndDecisionOrderByStepNoAsc(UUID approvalRequestId, ApprovalDecision decision);

    List<ApprovalStep> findByApprovalRequestIdOrderByStepNoAsc(UUID approvalRequestId);
}
