package vn.acme.paperless_meeting.controller.notification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.entity.Notification;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.repository.NotificationRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {

    NotificationRepository notificationRepository;
    CurrentUserService currentUserService;

    public static class NotificationDTO {
        public UUID id;
        public String type;
        public String content;
        public String channel;
        public LocalDateTime scheduledAt;
        public boolean unread;
        public String refType;
        public UUID refId;

        public NotificationDTO(Notification notif) {
            this.id = notif.getId();
            this.type = notif.getType() != null ? notif.getType().name() : null;
            this.content = notif.getContent();
            this.channel = notif.getChannel() != null ? notif.getChannel().name() : null;
            this.scheduledAt = notif.getScheduledAt();
            this.unread = notif.getReadAt() == null;
            this.refType = notif.getRefType() != null ? notif.getRefType().name() : null;
            this.refId = notif.getRefId();
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDTO>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        User caller = currentUserService.getCurrentActiveUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByScheduledAtDesc(caller.getId(), pageable);
        Page<NotificationDTO> dtoPage = notifications.map(NotificationDTO::new);
        return ResponseEntity.ok(ApiResponse.<Page<NotificationDTO>>builder()
                .success(true)
                .data(dtoPage)
                .build());
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        User caller = currentUserService.getCurrentActiveUser();
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification != null && notification.getUser().getId().equals(caller.getId())) {
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã đánh dấu đã đọc")
                .build());
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        User caller = currentUserService.getCurrentActiveUser();
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByScheduledAtDesc(caller.getId(), PageRequest.of(0, 1000));
        for (Notification notif : notifications.getContent()) {
            if (notif.getReadAt() == null) {
                notif.setReadAt(LocalDateTime.now());
                notificationRepository.save(notif);
            }
        }
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã đánh dấu tất cả đã đọc")
                .build());
    }
}
