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
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;

public class MeetingSpecification {
    public static Specification<Meeting> build(String keyword, MeetingStatus status, List<MeetingStatus> statuses, LocalDateTime fromDate, LocalDateTime toDate, List<UUID> allowedDeptIds, UUID userId, boolean isSuperAdmin, boolean isDeptAdmin, Boolean onlyMyMeetings, InviteStatus inviteStatus, Boolean approvedByMe) {
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
                    Join<Object, Object> preparerJoin = agendaJoin.join("preparedByUser", JoinType.LEFT);
                    acceptedOrMine.add(cb.equal(preparerJoin.get("id"), userId));
                    
                    // 3. Accepted Participant
                    Join<Object, Object> participantJoin = root.join("meetingParticipantList", JoinType.LEFT);
                    Join<Object, Object> userJoin = participantJoin.join("user", JoinType.LEFT);
                    Predicate isParticipant = cb.equal(userJoin.get("id"), userId);
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
                Join<Object, Object> userJoin = participantJoin.join("user", JoinType.LEFT);
                myMeetingsPredicates.add(cb.equal(userJoin.get("id"), userId));
                
                Join<Object, Object> agendaJoin = root.join("agendaItemList", JoinType.LEFT);
                Join<Object, Object> preparerJoin = agendaJoin.join("preparedByUser", JoinType.LEFT);
                myMeetingsPredicates.add(cb.equal(preparerJoin.get("id"), userId));
                
                predicates.add(cb.or(myMeetingsPredicates.toArray(new Predicate[0])));
                query.distinct(true);
            }

            // Lọc theo cuộc họp tôi đã phê duyệt
            // Điều kiện: đã phê duyệt VÀ không phải creator/thành viên (nếu là thành viên thì đã hiện ở tab bình thường)
            if (Boolean.TRUE.equals(approvedByMe)) {
                // Đã phê duyệt bởi người dùng này
                predicates.add(cb.equal(root.get("approvedBy").get("id"), userId));

                // Không phải creator
                Predicate notCreator = cb.notEqual(root.get("createdBy").get("id"), userId);

                // Không phải participant (dùng subquery để kiểm tra)
                Subquery<Long> participantSubquery = query.subquery(Long.class);
                Root<MeetingParticipant> subParticipant = participantSubquery.from(MeetingParticipant.class);
                participantSubquery.select(cb.count(subParticipant));
                participantSubquery.where(
                    cb.equal(subParticipant.get("meeting").get("id"), root.get("id")),
                    cb.equal(subParticipant.get("user").get("id"), userId)
                );
                Predicate notParticipant = cb.equal(participantSubquery, 0L);

                // Không phải preparer tài liệu
                Subquery<Long> agendaSubquery = query.subquery(Long.class);
                Root<AgendaItem> subAgenda = agendaSubquery.from(AgendaItem.class);
                agendaSubquery.select(cb.count(subAgenda));
                agendaSubquery.where(
                    cb.equal(subAgenda.get("meeting").get("id"), root.get("id")),
                    cb.equal(subAgenda.get("preparedByUser").get("id"), userId)
                );
                Predicate notPreparer = cb.equal(agendaSubquery, 0L);

                // Chỉ hiện ở tab này nếu KHÔNG thuộc bất kỳ vai trò nào trong cuộc họp
                predicates.add(cb.and(notCreator, notParticipant, notPreparer));
            }

            // Lọc phân quyền (RBAC) - chỉ áp dụng khi không yêu cầu lọc "chỉ cuộc họp của tôi" hoặc "cuộc họp tôi đã phê duyệt" hoặc khi không phải Super Admin
            if (!isSuperAdmin && !Boolean.TRUE.equals(onlyMyMeetings) && !Boolean.TRUE.equals(approvedByMe)) {
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

                    // Loại trừ các cuộc họp mà người dùng đã phê duyệt nhưng không tham gia (sẽ hiện ở tab "Đã duyệt")
                    // Subquery kiểm tra user có phải participant không
                    Subquery<Long> isParticipantCheck = query.subquery(Long.class);
                    Root<MeetingParticipant> partCheckRoot = isParticipantCheck.from(MeetingParticipant.class);
                    isParticipantCheck.select(cb.count(partCheckRoot));
                    isParticipantCheck.where(
                        cb.equal(partCheckRoot.get("meeting").get("id"), root.get("id")),
                        cb.equal(partCheckRoot.get("user").get("id"), userId)
                    );
                    
                    // Sử dụng LEFT JOIN để tránh implicit INNER JOIN khi approvedBy null
                    Join<Object, Object> approvedByJoin = root.join("approvedBy", JoinType.LEFT);
                    
                    // Điều kiện "chỉ là người phê duyệt, không có vai trò khác"
                    Predicate approverOnly = cb.and(
                        cb.isNotNull(root.get("approvedBy")),                 // đã có người phê duyệt
                        cb.equal(approvedByJoin.get("id"), userId),           // đã phê duyệt
                        cb.notEqual(root.get("createdBy").get("id"), userId), // không phải creator
                        cb.equal(isParticipantCheck, 0L)                      // không phải participant
                    );
                    // Chỉ hiện ở tab RBAC nếu KHÔNG rơi vào nhóm "chỉ là người phê duyệt"
                    securityPredicates.add(cb.and(inDept, allowedStatuses, cb.not(approverOnly)));
                }

                // 3. Bạn là người chuẩn bị tài liệu (Preparer) cho ít nhất một nội dung cuộc họp
                Join<Object, Object> agendaJoin = root.join("agendaItemList", JoinType.LEFT);
                Join<Object, Object> preparerJoin = agendaJoin.join("preparedByUser", JoinType.LEFT);
                securityPredicates.add(cb.equal(preparerJoin.get("id"), userId));

                // 4. Bạn là người được mời tham gia cuộc họp và cuộc họp ĐÃ ĐƯỢC CÔNG BỐ (UPCOMING, IN_PROGRESS, CLOSED, CANCELLED, EXPIRED)
                Join<Object, Object> participantJoin = root.join("meetingParticipantList", JoinType.LEFT);
                Join<Object, Object> userJoin = participantJoin.join("user", JoinType.LEFT);
                Predicate isParticipant = cb.equal(userJoin.get("id"), userId);
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
