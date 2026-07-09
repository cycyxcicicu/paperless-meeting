package vn.acme.paperless_meeting.service.agenda;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.PositionCode;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.department.DepartmentService;

/**
 * Quy tắc dùng chung: nội dung/tài liệu nháp của một Agenda Item chỉ hiển thị cho
 * người tạo cuộc họp / người được giao chuẩn bị nội dung đó / SUPER_ADMIN / admin-đơn-vị
 * hoặc lãnh đạo (Chủ tịch/Giám đốc) quản lý đơn vị đó - MIỄN LÀ cuộc họp chưa ở trạng
 * thái "đã công bố". Trích xuất từ logic gốc trong AgendaItemService để dùng chung cho
 * cả giao diện thường và trợ lý AI (MeetingInfoSlice/DocumentSlice), tránh 2 nơi lệch
 * quy tắc.
 *
 * Cố tình KHÔNG dùng CurrentUserService.hasRole()/SecurityContextHolder: trợ lý AI có
 * thể gọi qua CompletableFuture (khi Điều phối chọn từ 2 agent trở lên), chạy trên luồng
 * nền không có SecurityContext - phải tra role/vị trí trực tiếp từ User đã nạp sẵn.
 */
@Service
@RequiredArgsConstructor
public class MeetingDraftAccessService {

    private static final List<MeetingStatus> PUBLISHED_STATUSES = List.of(
            MeetingStatus.APPROVED, MeetingStatus.UPCOMING, MeetingStatus.IN_PROGRESS,
            MeetingStatus.CLOSED, MeetingStatus.CANCELLED, MeetingStatus.EXPIRED);

    private final UserRepository userRepository;
    private final DepartmentService departmentService;

    public boolean isPublished(Meeting meeting) {
        return meeting.getStatus() != null && PUBLISHED_STATUSES.contains(meeting.getStatus());
    }

    /**
     * true nếu callerId được xem nội dung/tài liệu nháp của agendaItem này dù cuộc họp
     * chưa công bố. agendaItem có thể null (tài liệu chung không gắn nội dung cụ thể) -
     * khi đó chỉ còn xét theo vai trò/quan hệ với cuộc họp, không xét preparedByUser.
     */
    public boolean canViewDraftAgendaItem(Meeting meeting, UUID callerId, AgendaItem agendaItem) {
        if (isPublished(meeting)) {
            return true;
        }
        if (callerId == null) {
            return false;
        }

        boolean isCreator = meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(callerId);
        boolean isPreparerOfThis = agendaItem != null && agendaItem.getPreparedByUser() != null
                && agendaItem.getPreparedByUser().getId().equals(callerId);
        if (isCreator || isPreparerOfThis) {
            return true;
        }

        User caller = userRepository.findById(callerId).orElse(null);
        if (caller == null) {
            return false;
        }

        String roleCode = caller.getRole() != null ? caller.getRole().getRoleCode() : null;
        if (RoleName.SUPER_ADMIN.getCode().equals(roleCode)) {
            return true;
        }
        boolean isDeptAdmin = RoleName.DEPARTMENT_ADMIN.getCode().equals(roleCode);
        boolean isLeader = caller.getPosition() != null
                && (PositionCode.CHU_TICH.getCode().equals(caller.getPosition().getPositionCode())
                        || PositionCode.GIAM_DOC.getCode().equals(caller.getPosition().getPositionCode()));
        if ((isDeptAdmin || isLeader) && meeting.getDepartment() != null && caller.getDepartment() != null) {
            List<UUID> subDepts = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
            return subDepts.contains(meeting.getDepartment().getId());
        }
        return false;
    }
}
