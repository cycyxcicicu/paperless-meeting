package vn.acme.paperless_meeting.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.AssistantMessage;

public interface AssistantMessageRepository extends JpaRepository<AssistantMessage, UUID> {

    /**
     * Phân trang theo cursor (keyset), KHÔNG dùng OFFSET số trang: luôn lấy đúng
     * "size" tin nhắn gần nhất TRƯỚC thời điểm :before, sắp xếp mới nhất trước.
     * Vì mốc neo là created_at của tin cũ nhất đã tải (không phải số thứ tự trang),
     * kết quả không bị lệch dù có tin nhắn mới liên tục được ghi thêm ở phía sau
     * trong lúc người dùng đang cuộn lên xem lịch sử cũ.
     */
    @Query("SELECT m FROM AssistantMessage m " +
           "WHERE m.meeting.id = :meetingId AND m.user.id = :userId " +
           "AND (:before IS NULL OR m.createdAt < :before) " +
           "ORDER BY m.createdAt DESC")
    List<AssistantMessage> findPageBeforeCursor(@Param("meetingId") UUID meetingId,
            @Param("userId") UUID userId,
            @Param("before") LocalDateTime before,
            Pageable pageable);
}
