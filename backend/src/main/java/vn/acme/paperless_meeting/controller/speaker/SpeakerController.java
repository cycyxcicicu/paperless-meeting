package vn.acme.paperless_meeting.controller.speaker;

import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.speaker.ReorderQueueRequest;
import vn.acme.paperless_meeting.dto.request.speaker.StartDirectTurnRequest;
import vn.acme.paperless_meeting.dto.request.speaker.StartTurnRequest;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.response.speaker.SpeakerQueueResponse;
import vn.acme.paperless_meeting.dto.response.speaker.SpeakerTurnResponse;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueueStatus;
import vn.acme.paperless_meeting.service.speaker.SpeakerService;

@RestController
@RequestMapping("/meetings/{meetingId}/speakers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SpeakerController {

    SpeakerService speakerService;

    @PostMapping("/request")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public ApiResponse<SpeakerQueueResponse> requestToSpeak(
            @PathVariable UUID meetingId,
            @RequestParam(required = false) UUID agendaItemId) {
        return ApiResponse.<SpeakerQueueResponse>builder()
                .data(speakerService.requestToSpeak(meetingId, agendaItemId))
                .build();
    }

    @DeleteMapping("/request/{queueId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public ApiResponse<Void> cancelRequest(
            @PathVariable UUID meetingId,
            @PathVariable UUID queueId) {
        speakerService.rejectOrCancelRequest(meetingId, queueId);
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/reject/{queueId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public ApiResponse<Void> rejectRequest(
            @PathVariable UUID meetingId,
            @PathVariable UUID queueId) {
        speakerService.rejectOrCancelRequest(meetingId, queueId);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public ApiResponse<List<SpeakerQueueResponse>> getQueue(
            @PathVariable UUID meetingId,
            @RequestParam(required = false) SpeakerQueueStatus status) {
        return ApiResponse.<List<SpeakerQueueResponse>>builder()
                .data(speakerService.getQueue(meetingId, status))
                .build();
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public ApiResponse<Void> reorderQueue(
            @PathVariable UUID meetingId,
            @RequestBody ReorderQueueRequest request) {
        speakerService.reorderQueue(meetingId, request);
        return ApiResponse.<Void>builder().build();
    }

    @PostMapping("/start-turn/{queueId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public ApiResponse<SpeakerTurnResponse> startTurn(
            @PathVariable UUID meetingId,
            @PathVariable UUID queueId,
            @RequestBody StartTurnRequest request) {
        return ApiResponse.<SpeakerTurnResponse>builder()
                .data(speakerService.startTurn(meetingId, queueId, request))
                .build();
    }

    @PostMapping("/start-direct-turn")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public ApiResponse<SpeakerTurnResponse> startDirectTurn(
            @PathVariable UUID meetingId,
            @RequestBody StartDirectTurnRequest request) {
        return ApiResponse.<SpeakerTurnResponse>builder()
                .data(speakerService.startDirectTurn(meetingId, request))
                .build();
    }

    @PostMapping("/stop-turn/{turnId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public ApiResponse<SpeakerTurnResponse> stopTurn(
            @PathVariable UUID meetingId,
            @PathVariable UUID turnId) {
        return ApiResponse.<SpeakerTurnResponse>builder()
                .data(speakerService.stopTurn(meetingId, turnId))
                .build();
    }
}
