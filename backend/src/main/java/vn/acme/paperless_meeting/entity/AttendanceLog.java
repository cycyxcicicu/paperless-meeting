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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.AttendanceMethod;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "attendance_logs", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "meeting_id", "user_id" }, name = "uk_attendance_meeting_user"),
                @UniqueConstraint(columnNames = { "meeting_id", "guest_id" }, name = "uk_attendance_meeting_guest")
}, indexes = {
                @Index(columnList = "meeting_id", name = "idx_attendance_meeting"),
                @Index(columnList = "user_id", name = "idx_attendance_user"),
                @Index(columnList = "guest_id", name = "idx_attendance_guest"),
                @Index(columnList = "checkin_time", name = "idx_attendance_checkin_time")
})

// Bảng ghi lại thông tin điểm danh của người dùng trong cuộc họp,
// bao gồm thời gian check-in, check-out, phương thức điểm danh (ví dụ: thủ
// công, tự động qua thiết bị),
// trạng thái tham dự (đúng giờ, muộn, vắng mặt), số phút muộn (nếu có),
// và ghi chú liên quan đến việc điểm danh. Bảng này giúp theo dõi sự tham gia
// của
// người dùng trong các cuộc họp và hỗ trợ các chức năng liên quan đến quản lý
// cuộc họp và báo cáo.
public class AttendanceLog {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @Column(name = "checkin_time")
        private LocalDateTime checkinTime;

        @Column(name = "checkout_time")
        private LocalDateTime checkoutTime;

        @Enumerated(EnumType.STRING)
        @Column(name = "method")
        private AttendanceMethod method;

        @Enumerated(EnumType.STRING)
        @Column(name = "status")
        private AttendanceStatus status;

        private Integer lateMinutes;

        private String note;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "meeting_id")
        private Meeting meeting;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id")
        private User user;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "guest_id")
        private MeetingGuest guest;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "recorded_by")
        private User recordedBy;
}
