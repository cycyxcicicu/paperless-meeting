package vn.acme.paperless_meeting.controller.meetingparticipant;

import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.AddAttendeesRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.UpdateInviteStatusRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.UpdateAttendanceStatusRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.SendInvitationsRequest;
import vn.acme.paperless_meeting.dto.request.opinion.OpinionRequest;
import org.springframework.http.MediaType;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.AttendeeResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.GuestResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.ParticipantResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.MeetingAttendeesResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.AttendeeStatisticsResponse;
import vn.acme.paperless_meeting.dto.response.meeting.PublicMeetingInviteResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse;
import vn.acme.paperless_meeting.dto.response.agenda.AgendaItemResponse;
import vn.acme.paperless_meeting.dto.response.speaker.SpeakerQueueResponse;
import vn.acme.paperless_meeting.dto.response.motion.MotionResponse;
import vn.acme.paperless_meeting.dto.response.motion.VoteStatisticsResponse;
import vn.acme.paperless_meeting.dto.response.opinion.OpinionResponse;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.service.meetingparticipant.MeetingParticipantService;

@RestController
@RequestMapping("/meetings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Meeting Participant", description = "Quản lý người tham dự — thêm, điểm danh, phản hồi thư mời")
public class MeetingParticipantController {

    MeetingParticipantService meetingParticipantService;

    @Operation(summary = "Thêm / cập nhật danh sách người tham dự",
               description = "Ghi đè toàn bộ danh sách đơn vị + khách mời. Gửi lại khi muốn thay đổi.")
    @PostMapping("/{meetingId}/attendees")
    public ApiResponse<MeetingAttendeesResponse> addAttendees(
            @PathVariable UUID meetingId, @Valid @RequestBody AddAttendeesRequest request) {
        return ApiResponse.<MeetingAttendeesResponse>builder()
                .success(true).message("Cập nhật danh sách người tham dự cuộc họp thành công")
                .data(meetingParticipantService.addAttendees(meetingId, request)).build();
    }

    @Operation(summary = "Lấy danh sách người tham dự cuộc họp",
               description = "Trả về đại diện đơn vị và khách mời, kèm trạng thái phản hồi thư mời.")
    @GetMapping("/{meetingId}/attendees")
    public ApiResponse<MeetingAttendeesResponse> getAttendees(@PathVariable UUID meetingId) {
        return ApiResponse.<MeetingAttendeesResponse>builder()
                .success(true).message("Lấy danh sách người tham dự thành công")
                .data(meetingParticipantService.getAttendees(meetingId)).build();
    }

    @Operation(summary = "Thống kê điểm danh cuộc họp",
               description = "Số lượng xác nhận, từ chối, chưa phản hồi và tỷ lệ tham dự.")
    @GetMapping("/{meetingId}/attendees/statistics")
    public ApiResponse<AttendeeStatisticsResponse> getAttendeeStatistics(@PathVariable UUID meetingId) {
        return ApiResponse.<AttendeeStatisticsResponse>builder()
                .success(true).message("Lấy số liệu thống kê người tham dự thành công")
                .data(meetingParticipantService.getAttendeeStatistics(meetingId)).build();
    }

    @Operation(summary = "Chủ động gửi thư mời cho đại biểu/khách mời",
               description = "API này hỗ trợ gửi thủ công, gọi nhiều lần (check chống spam), hoặc ép gửi lại (forceResend).")
    @PostMapping("/{meetingId}/invitations/send")
    public ApiResponse<Void> sendInvitations(
            @PathVariable UUID meetingId, @Valid @RequestBody SendInvitationsRequest request) {
        meetingParticipantService.sendInvitations(meetingId, request);
        return ApiResponse.<Void>builder().success(true).message("Đã gửi thư mời họp thành công").build();
    }

    @Operation(summary = "Phản hồi thư mời họp (user nội bộ)",
               description = "Xác nhận ACCEPTED hoặc DECLINED. Cần đăng nhập.")
    @PutMapping("/{meetingId}/participants/{userId}/invite-status")
    public ApiResponse<Void> updateInviteStatus(
            @PathVariable UUID meetingId, @PathVariable UUID userId,
            @Valid @RequestBody UpdateInviteStatusRequest request) {
        meetingParticipantService.updateInviteStatus(meetingId, userId, request);
        return ApiResponse.<Void>builder().success(true).message("Phản hồi thư mời họp thành công").build();
    }

    @Operation(summary = "Xem thư mời họp công khai (không cần đăng nhập)",
               description = "Tra cứu thư mời qua rsvpToken nhận trong email.")
    @GetMapping("/public/invite")
    public ApiResponse<PublicMeetingInviteResponse> publicGetInviteByRsvpToken(@RequestParam UUID rsvpToken) {
        return ApiResponse.<PublicMeetingInviteResponse>builder()
                .success(true).message("Lấy thông tin thư mời họp công khai thành công")
                .data(meetingParticipantService.publicGetInviteByRsvpToken(rsvpToken)).build();
    }

    @Operation(summary = "Khách mời phản hồi RSVP (không cần đăng nhập)",
               description = "Khách mời xác nhận / từ chối qua link email chứa rsvpToken.")
    @PutMapping("/public/rsvp")
    public ApiResponse<GuestResponse> publicUpdateGuestRsvpByRsvpToken(
            @RequestParam UUID rsvpToken, @Valid @RequestBody UpdateInviteStatusRequest request) {
        return ApiResponse.<GuestResponse>builder()
                .success(true).message("Phản hồi thư mời họp của khách thành công")
                .data(meetingParticipantService.publicUpdateGuestRsvpByRsvpToken(rsvpToken, request)).build();
    }

    @Operation(summary = "Xác nhận tham dự cuộc họp qua email (không cần đăng nhập)",
               description = "Đại biểu hoặc khách mời click vào link email để tự động xác nhận tham dự. Trả về trang HTML thông báo.")
    @GetMapping(value = "/public/rsvp/confirm", produces = MediaType.TEXT_HTML_VALUE)
    public String publicConfirmRsvp(
            @RequestParam(required = false) UUID participantId,
            @RequestParam(required = false) UUID rsvpToken) {
        try {
            meetingParticipantService.publicConfirmRsvp(participantId, rsvpToken);
            return meetingParticipantService.renderRsvpSuccessHtml();
        } catch (Exception e) {
            return meetingParticipantService.renderRsvpErrorHtml(e.getMessage());
        }
    }

    @Operation(summary = "Lấy thông tin cuộc họp bằng guestToken (không cần đăng nhập)",
               description = "Khách mời dùng guestToken để xem thông tin phòng họp.")
    @GetMapping("/public")
    public ApiResponse<MeetingResponse> publicGetMeetingByGuestToken(@RequestParam UUID guestToken) {
        return ApiResponse.<MeetingResponse>builder()
                .success(true).message("Lấy chi tiết phòng họp qua guestToken thành công")
                .data(meetingParticipantService.publicGetMeetingByGuestToken(guestToken)).build();
    }

    @Operation(summary = "Lấy danh sách tài liệu cho khách (không cần đăng nhập)",
               description = "Khách mời dùng guestToken để lấy danh sách tài liệu được phép xem (không bảo mật).")
    @GetMapping("/public/documents")
    public ApiResponse<List<MeetingDocumentResponse>> publicGetMeetingDocumentsByGuestToken(@RequestParam UUID guestToken) {
        return ApiResponse.<List<MeetingDocumentResponse>>builder()
                .success(true).message("Lấy danh sách tài liệu qua guestToken thành công")
                .data(meetingParticipantService.publicGetMeetingDocumentsByGuestToken(guestToken)).build();
    }

    @Operation(summary = "Tải tài liệu cho khách (không cần đăng nhập)",
               description = "Khách mời dùng guestToken để tải tài liệu được phép xem.")
    @GetMapping("/public/documents/{documentId}/download")
    public ResponseEntity<Resource> publicDownloadDocument(
            @PathVariable UUID documentId,
            @RequestParam UUID guestToken,
            @RequestParam(name = "inline", required = false, defaultValue = "false") boolean inline) {
        return meetingParticipantService.publicDownloadDocument(documentId, guestToken, inline);
    }

    @Operation(summary = "Khách mời tự điểm danh",
               description = "Cho phép khách mời dùng guestToken để tự điểm danh.")
    @PutMapping("/public/attendees/attendance")
    public ApiResponse<AttendeeResponse> publicUpdateAttendanceStatus(
            @RequestParam UUID guestToken, @Valid @RequestBody UpdateAttendanceStatusRequest request) {
        return ApiResponse.<AttendeeResponse>builder()
                .success(true).message("Khách mời điểm danh thành công")
                .data(meetingParticipantService.publicUpdateAttendanceStatus(guestToken, request)).build();
    }

    @Operation(summary = "Điểm danh người tham dự",
               description = "Cập nhật PRESENT / ABSENT / LATE. Dùng ?type=INTERNAL cho thành viên chính thức "
                       + "hoặc ?type=guest cho khách mời.")
    @PutMapping("/{meetingId}/attendees/{attendeeId}/attendance")
    public ApiResponse<AttendeeResponse> updateAttendanceStatus(
            @PathVariable UUID meetingId, @PathVariable UUID attendeeId,
            @RequestParam String type, @Valid @RequestBody UpdateAttendanceStatusRequest request) {
        return ApiResponse.<AttendeeResponse>builder()
                .success(true).message("Điểm danh người tham dự thành công")
                .data(meetingParticipantService.updateAttendanceStatus(meetingId, attendeeId, type, request)).build();
    }

    @Operation(summary = "Xóa người tham dự khỏi cuộc họp",
               description = "Gỡ người tham dự. Dùng ?type=attendee hoặc ?type=guest. Chỉ khi cuộc họp chưa diễn ra.")
    @DeleteMapping("/{meetingId}/attendees/{attendeeId}")
    public ApiResponse<Void> removeAttendee(
            @PathVariable UUID meetingId, @PathVariable UUID attendeeId, @RequestParam String type) {
        meetingParticipantService.removeAttendee(meetingId, attendeeId, type);
        return ApiResponse.<Void>builder().success(true).message("Xóa người tham dự khỏi cuộc họp thành công").build();
    }

    @Operation(summary = "Gửi lại email thư mời cho người tham dự",
               description = "Gửi lại email thư mời. Dùng ?type=INTERNAL hoặc ?type=GUEST.")
    @PostMapping("/{meetingId}/attendees/{attendeeId}/resend-email")
    public ApiResponse<Void> resendEmail(
            @PathVariable UUID meetingId, @PathVariable UUID attendeeId, @RequestParam String type) {
        meetingParticipantService.resendEmail(meetingId, attendeeId, type);
        return ApiResponse.<Void>builder().success(true).message("Gửi lại email thư mời thành công").build();
    }

    @Operation(summary = "Lấy danh sách nội dung họp cho khách (không cần đăng nhập)")
    @GetMapping("/public/agenda-items")
    public ApiResponse<List<AgendaItemResponse>> publicGetAgendaItemsByGuestToken(
            @RequestParam UUID guestToken) {
        return ApiResponse.<List<AgendaItemResponse>>builder()
                .success(true).message("Lấy danh sách nội dung họp thành công")
                .data(meetingParticipantService.publicGetAgendaItemsByGuestToken(guestToken)).build();
    }

    @Operation(summary = "Lấy danh sách hàng chờ phát biểu cho khách (không cần đăng nhập)")
    @GetMapping("/public/speakers/queue")
    public ApiResponse<List<SpeakerQueueResponse>> publicGetSpeakersQueueByGuestToken(
            @RequestParam UUID guestToken) {
        return ApiResponse.<List<SpeakerQueueResponse>>builder()
                .success(true).message("Lấy danh sách hàng chờ phát biểu thành công")
                .data(meetingParticipantService.publicGetSpeakersQueueByGuestToken(guestToken)).build();
    }

    @Operation(summary = "Khách mời đi thay gửi yêu cầu phát biểu (không cần đăng nhập)")
    @PostMapping("/public/speakers/request")
    public ApiResponse<SpeakerQueueResponse> publicRequestToSpeakByGuestToken(
            @RequestParam UUID guestToken,
            @RequestParam(required = false) UUID agendaItemId) {
        return ApiResponse.<SpeakerQueueResponse>builder()
                .success(true).message("Đăng ký phát biểu thành công")
                .data(meetingParticipantService.publicRequestToSpeakByGuestToken(guestToken, agendaItemId)).build();
    }

    @Operation(summary = "Lấy danh sách biểu quyết cho khách (không cần đăng nhập)")
    @GetMapping("/public/motions")
    public ApiResponse<List<MotionResponse>> publicGetMeetingMotionsByGuestToken(
            @RequestParam UUID guestToken) {
        return ApiResponse.<List<MotionResponse>>builder()
                .success(true).message("Lấy danh sách biểu quyết thành công")
                .data(meetingParticipantService.publicGetMeetingMotionsByGuestToken(guestToken)).build();
    }

    @Operation(summary = "Lấy kết quả biểu quyết cho khách (không cần đăng nhập)")
    @GetMapping("/public/motions/{id}/vote-statistics")
    public ApiResponse<VoteStatisticsResponse> publicGetVoteStatisticsByGuestToken(
            @PathVariable UUID id, @RequestParam UUID guestToken) {
        return ApiResponse.<VoteStatisticsResponse>builder()
                .success(true).message("Lấy kết quả biểu quyết thành công")
                .data(meetingParticipantService.publicGetVoteStatisticsByGuestToken(id, guestToken)).build();
    }

    @Operation(summary = "Lấy danh sách ý kiến đóng góp cho khách (không cần đăng nhập)")
    @GetMapping("/public/opinions")
    public ApiResponse<List<OpinionResponse>> publicGetOpinionsByGuestToken(
            @RequestParam UUID guestToken) {
        return ApiResponse.<List<OpinionResponse>>builder()
                .success(true).message("Lấy danh sách ý kiến đóng góp thành công")
                .data(meetingParticipantService.publicGetOpinionsByGuestToken(guestToken)).build();
    }

    @Operation(summary = "Khách mời gửi ý kiến đóng góp (không cần đăng nhập)")
    @PostMapping("/public/opinions")
    public ApiResponse<OpinionResponse> publicCreateOpinionByGuestToken(
            @RequestParam UUID guestToken,
            @RequestBody @Valid OpinionRequest request) {
        return ApiResponse.<OpinionResponse>builder()
                .success(true).message("Gửi ý kiến đóng góp thành công")
                .data(meetingParticipantService.publicCreateOpinionByGuestToken(guestToken, request)).build();
    }

    @Operation(summary = "Lấy danh sách thành phần tham dự cho khách (không cần đăng nhập)")
    @GetMapping("/public/attendees")
    public ApiResponse<MeetingAttendeesResponse> publicGetAttendeesByGuestToken(
            @RequestParam UUID guestToken) {
        return ApiResponse.<MeetingAttendeesResponse>builder()
                .success(true).message("Lấy danh sách thành phần tham dự thành công")
                .data(meetingParticipantService.publicGetAttendeesByGuestToken(guestToken)).build();
     }

    @Operation(summary = "Lấy danh sách người đi thay phù hợp cho đại biểu",
               description = "Lọc nhân sự cùng phòng ban có chức vụ ngang bằng hoặc thấp hơn.")
    @GetMapping("/{meetingId}/eligible-substitutes")
    public ApiResponse<List<UserResponse>> getEligibleSubstitutes(@PathVariable UUID meetingId) {
        return ApiResponse.<List<UserResponse>>builder()
                .success(true).message("Lấy danh sách người đi thay phù hợp thành công")
                .data(meetingParticipantService.getEligibleSubstitutes(meetingId)).build();
    }
}
