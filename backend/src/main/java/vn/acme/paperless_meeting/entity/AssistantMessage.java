package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.AssistantMessageRole;

/**
 * Lưu lại lịch sử hội thoại giữa 1 người dùng với trợ lý AI của 1 cuộc họp,
 * để tải lại khi mở lại khung chat (kể cả sau khi tải lại trang / đăng nhập lại).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "assistant_messages", indexes = {
        @Index(columnList = "meeting_id, user_id", name = "idx_assistant_message_meeting_user")
})
public class AssistantMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private AssistantMessageRole role;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "agents_used")
    private String agentsUsed;

    @Column(name = "off_topic")
    private Boolean offTopic;

    /**
     * Gán thủ công ở tầng service (không dùng @CreationTimestamp) để đảm bảo thứ tự
     * tuyệt đối giữa tin nhắn user và assistant của cùng 1 lượt - đây là cột dùng làm
     * con trỏ (cursor) phân trang lịch sử, không thể để trùng/không xác định thứ tự.
     */
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
