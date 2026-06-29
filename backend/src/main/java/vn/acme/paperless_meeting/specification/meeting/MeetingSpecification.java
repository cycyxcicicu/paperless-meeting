package vn.acme.paperless_meeting.specification.meeting;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;

public class MeetingSpecification {
    public static Specification<Meeting> build(String keyword, MeetingStatus status, List<MeetingStatus> statuses, LocalDateTime fromDate, LocalDateTime toDate, List<UUID> allowedDeptIds, UUID userId, boolean isSuperAdmin, boolean isDeptAdmin, Boolean onlyMyMeetings, InviteStatus inviteStatus) {
        return (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("createdBy", JoinType.LEFT);
                root.fetch("location", JoinType.LEFT);
                root.fetch("department", JoinType.LEFT);
            }

            List<Predicate> predicates = new ArrayList<>();

            // Lọc theo trạng thái lời mời (inviteStatus) của người dùng hiện tại
            if (inviteStatus != null) {
                if (inviteStatus == InviteStatus.ACCEPTED) {
                    List<Predicate> acceptedOrMine = new ArrayList<>();
                    
                    // 1. Creator
                    acceptedOrMine.add(cb.equal(root.get("createdBy").get("id"), userId));
                    
                    // 2. Preparer
                    Join<Object, Object> agendaJoin = root.join("agendaItemList", JoinType.LEFT);
                    acceptedOrMine.add(cb.equal(agendaJoin.get("preparedByUser").get("id"), userId));
                    
                    // 3. Accepted Participant
                    Join<Object, Object> participantJoin = root.join("meetingParticipantList", JoinType.LEFT);
                    Predicate isParticipant = cb.equal(participantJoin.get("user").get("id"), userId);
                    Predicate isAccepted = cb.equal(participantJoin.get("inviteStatus"), InviteStatus.ACCEPTED);
                    acceptedOrMine.add(cb.and(isParticipant, isAccepted));
                    
                    predicates.add(cb.or(acceptedOrMine.toArray(new Predicate[0])));
                    
                    // Exclude meetings where the current user has a PENDING invitation
                    Subquery<Long> subquery = query.subquery(Long.class);
                    Root<MeetingParticipant> subRoot = subquery.from(MeetingParticipant.class);
                    subquery.select(cb.count(subRoot));
                    subquery.where(
                        cb.equal(subRoot.get("meeting").get("id"), root.get("id")),
                        cb.equal(subRoot.get("user").get("id"), userId),
                        cb.equal(subRoot.get("inviteStatus"), InviteStatus.PENDING)
                    );
                    predicates.add(cb.equal(subquery, 0L));

                    query.distinct(true);
                } else if (inviteStatus == InviteStatus.PENDING) {
                    Join<Object, Object> participantJoin = root.join("meetingParticipantList");
                    if (Boolean.TRUE.equals(onlyMyMeetings)) {
                        predicates.add(cb.equal(participantJoin.get("user").get("id"), userId));
                    }
                    predicates.add(cb.equal(participantJoin.get("inviteStatus"), InviteStatus.PENDING));
                    query.distinct(true);
                } else {
                    Join<Object, Object> participantJoin = root.join("meetingParticipantList");
                    if (Boolean.TRUE.equals(onlyMyMeetings)) {
                        predicates.add(cb.equal(participantJoin.get("user").get("id"), userId));
                    }
                    predicates.add(cb.equal(participantJoin.get("inviteStatus"), inviteStatus));
                    query.distinct(true);
                }
            }


            // Lọc theo từ khóa (tìm kiếm theo tên cuộc họp)
            if (keyword != null && !keyword.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%"));
            }

            // Lọc theo trạng thái đơn lẻ
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Lọc theo danh sách trạng thái
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }

            // Lọc theo khoảng thời gian (giao thoa giữa thời gian cuộc họp và khoảng tìm kiếm)
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("endTime"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startTime"), toDate));
            }

            // Lọc chỉ cuộc họp của tôi (My Meetings) gồm: người tạo, người được mời tham gia hoặc người chuẩn bị tài liệu
            if (Boolean.TRUE.equals(onlyMyMeetings)) {
                List<Predicate> myMeetingsPredicates = new ArrayList<>();
                
                myMeetingsPredicates.add(cb.equal(root.get("createdBy").get("id"), userId));
                
                Join<Object, Object> participantJoin = root.join("meetingParticipantList", JoinType.LEFT);
                myMeetingsPredicates.add(cb.equal(participantJoin.get("user").get("id"), userId));
                
                Join<Object, Object> agendaJoin = root.join("agendaItemList", JoinType.LEFT);
                myMeetingsPredicates.add(cb.equal(agendaJoin.get("preparedByUser").get("id"), userId));
                
                predicates.add(cb.or(myMeetingsPredicates.toArray(new Predicate[0])));
                query.distinct(true);
            }

            // Lọc phân quyền (RBAC) - chỉ áp dụng khi không yêu cầu lọc "chỉ cuộc họp của tôi" hoặc khi không phải Super Admin
            if (!isSuperAdmin && !Boolean.TRUE.equals(onlyMyMeetings)) {
                List<Predicate> securityPredicates = new ArrayList<>();
                
                // 1. Bạn có thể nhìn thấy các cuộc họp do chính mình tạo ra
                securityPredicates.add(cb.equal(root.get("createdBy").get("id"), userId));

                // 2. Bạn có thể thấy các cuộc họp trong các phòng ban được phép (ví dụ: nếu bạn là Admin Đơn vị hoặc Lãnh đạo)
                if (allowedDeptIds != null && !allowedDeptIds.isEmpty()) {
                    Predicate inDept = root.get("department").get("id").in(allowedDeptIds);
                    // Chỉ hiển thị các cuộc họp đã được gửi phê duyệt, đã duyệt, hoặc các trạng thái công bố/diễn ra/kết thúc...
                    // Không hiển thị các cuộc họp nháp (DRAFT) hoặc bị từ chối (REJECTED) hoặc bị hủy (CANCELLED) của người khác.
                    Predicate allowedStatuses = root.get("status").in(List.of(
                        MeetingStatus.PENDING_APPROVAL,
                        MeetingStatus.APPROVED,
                        MeetingStatus.UPCOMING,
                        MeetingStatus.IN_PROGRESS,
                        MeetingStatus.CLOSED,
                        MeetingStatus.EXPIRED
                    ));
                    securityPredicates.add(cb.and(inDept, allowedStatuses));
                }

                // 3. Bạn là người chuẩn bị tài liệu (Preparer) cho ít nhất một nội dung cuộc họp
                Join<Object, Object> agendaJoin = root.join("agendaItemList", JoinType.LEFT);
                securityPredicates.add(cb.equal(agendaJoin.get("preparedByUser").get("id"), userId));

                // 4. Bạn là người được mời tham gia cuộc họp và cuộc họp ĐÃ ĐƯỢC CÔNG BỐ (UPCOMING, IN_PROGRESS, CLOSED, CANCELLED, EXPIRED)
                Join<Object, Object> participantJoin = root.join("meetingParticipantList", JoinType.LEFT);
                Predicate isParticipant = cb.equal(participantJoin.get("user").get("id"), userId);
                Predicate isPublished = root.get("status").in(List.of(
                    MeetingStatus.UPCOMING,
                    MeetingStatus.IN_PROGRESS,
                    MeetingStatus.CLOSED,
                    MeetingStatus.CANCELLED,
                    MeetingStatus.EXPIRED
                ));
                securityPredicates.add(cb.and(isParticipant, isPublished));

                predicates.add(cb.or(securityPredicates.toArray(new Predicate[0])));
                query.distinct(true); // Tránh duplicate dữ liệu do LEFT JOIN
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
