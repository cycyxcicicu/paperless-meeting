package vn.acme.paperless_meeting.controller.meetingparticipant;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.AddAttendeesRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.UpdateInviteStatusRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.UpdateAttendanceStatusRequest;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.AttendeeResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.GuestResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.ParticipantResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.MeetingAttendeesResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.AttendeeStatisticsResponse;
import vn.acme.paperless_meeting.dto.response.meeting.PublicMeetingInviteResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.service.meetingparticipant.MeetingParticipantService;

@RestController
@RequestMapping("/meetings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MeetingParticipantController {

    MeetingParticipantService meetingParticipantService;

    @PostMapping("/{meetingId}/attendees")
    public ApiResponse<MeetingAttendeesResponse> addAttendees(
            @PathVariable UUID meetingId,
            @Valid @RequestBody AddAttendeesRequest request) {
        return ApiResponse.<MeetingAttendeesResponse>builder()
                .success(true)
                .message("Cập nhật danh sách người tham dự cuộc họp thành công")
                .data(meetingParticipantService.addAttendees(meetingId, request))
                .build();
    }

    @GetMapping("/{meetingId}/attendees")
    public ApiResponse<MeetingAttendeesResponse> getAttendees(@PathVariable UUID meetingId) {
        return ApiResponse.<MeetingAttendeesResponse>builder()
                .success(true)
                .message("Lấy danh sách người tham dự thành công")
                .data(meetingParticipantService.getAttendees(meetingId))
                .build();
    }

    @GetMapping("/{meetingId}/attendees/statistics")
    public ApiResponse<AttendeeStatisticsResponse> getAttendeeStatistics(@PathVariable UUID meetingId) {
        return ApiResponse.<AttendeeStatisticsResponse>builder()
                .success(true)
                .message("Lấy số liệu thống kê người tham dự thành công")
                .data(meetingParticipantService.getAttendeeStatistics(meetingId))
                .build();
    }

    @PutMapping("/{meetingId}/participants/{userId}/invite-status")
    public ApiResponse<Void> updateInviteStatus(
            @PathVariable UUID meetingId,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateInviteStatusRequest request) {
        meetingParticipantService.updateInviteStatus(meetingId, userId, request);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Phản hồi thư mời họp thành công")
                .build();
    }

    @GetMapping("/public/invite")
    public ApiResponse<PublicMeetingInviteResponse> publicGetInviteByRsvpToken(
            @RequestParam UUID rsvpToken) {
        return ApiResponse.<PublicMeetingInviteResponse>builder()
                .success(true)
                .message("Lấy thông tin thư mời họp công khai thành công")
                .data(meetingParticipantService.publicGetInviteByRsvpToken(rsvpToken))
                .build();
    }

    @PutMapping("/public/rsvp")
    public ApiResponse<GuestResponse> publicUpdateGuestRsvpByRsvpToken(
            @RequestParam UUID rsvpToken,
            @Valid @RequestBody UpdateInviteStatusRequest request) {
        return ApiResponse.<GuestResponse>builder()
                .success(true)
                .message("Phản hồi thư mời họp của khách thành công")
                .data(meetingParticipantService.publicUpdateGuestRsvpByRsvpToken(rsvpToken, request))
                .build();
    }

    @GetMapping("/public")
    public ApiResponse<MeetingResponse> publicGetMeetingByGuestToken(
            @RequestParam UUID guestToken) {
        return ApiResponse.<MeetingResponse>builder()
                .success(true)
                .message("Lấy chi tiết phòng họp qua guestToken thành công")
                .data(meetingParticipantService.publicGetMeetingByGuestToken(guestToken))
                .build();
    }

    @PutMapping("/{meetingId}/attendees/{attendeeId}/attendance")
    public ApiResponse<AttendeeResponse> updateAttendanceStatus(
            @PathVariable UUID meetingId,
            @PathVariable UUID attendeeId,
            @RequestParam String type,
            @Valid @RequestBody UpdateAttendanceStatusRequest request) {
        return ApiResponse.<AttendeeResponse>builder()
                .success(true)
                .message("Điểm danh người tham dự thành công")
                .data(meetingParticipantService.updateAttendanceStatus(meetingId, attendeeId, type, request))
                .build();
    }

    @DeleteMapping("/{meetingId}/attendees/{attendeeId}")
    public ApiResponse<Void> removeAttendee(
            @PathVariable UUID meetingId,
            @PathVariable UUID attendeeId,
            @RequestParam String type) {
        meetingParticipantService.removeAttendee(meetingId, attendeeId, type);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa người tham dự khỏi cuộc họp thành công")
                .build();
    }
}
