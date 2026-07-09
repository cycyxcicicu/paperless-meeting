package vn.acme.paperless_meeting.service.opinion;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.opinion.OpinionRequest;
import vn.acme.paperless_meeting.dto.response.opinion.OpinionAttachmentResponse;
import vn.acme.paperless_meeting.dto.response.opinion.OpinionResponse;
import vn.acme.paperless_meeting.entity.Document;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.Opinion;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.DocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingDocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.OpinionRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OpinionService {

    OpinionRepository opinionRepository;
    MeetingRepository meetingRepository;
    DocumentRepository documentRepository;
    MeetingDocumentRepository meetingDocumentRepository;
    MeetingParticipantRepository meetingParticipantRepository;
    CurrentUserService currentUserService;
    AuditLogPublisher auditLogPublisher;

    @Transactional(readOnly = true)
    public List<OpinionResponse> getOpinions(UUID meetingId) {
        meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        List<Opinion> list = opinionRepository.findByMeetingIdWithUserAndAttachments(meetingId);
        if (list == null) {
            return Collections.emptyList();
        }

        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OpinionResponse createOpinion(UUID meetingId, OpinionRequest request) {
        Meeting meeting = getMeeting(meetingId);
        validateMeetingAllowsOpinion(meeting);

        User caller = currentUserService.getCurrentActiveUser();
        ensureParticipantPresent(meetingId, caller.getId());

        Opinion opinion = Opinion.builder()
                .meeting(meeting)
                .user(caller)
                .opinionDetail(request.getOpinionDetail())
                .documentName(request.getDocumentName())
                .createdAt(LocalDateTime.now())
                .build();

        List<Document> docs = resolveMeetingAttachments(meetingId, request.getDocumentIds());
        if (!docs.isEmpty()) {
            opinion.setAttachments(docs);
        }

        Opinion saved = opinionRepository.save(opinion);
        auditLogPublisher.publish(
                caller,
                AuditAction.CREATE_OPINION,
                ResourceType.OPINION,
                saved.getId(),
                Map.of("meetingId", String.valueOf(meetingId), "title", meeting.getTitle() != null ? meeting.getTitle() : "", "detail", saved.getOpinionDetail() != null ? saved.getOpinionDetail() : "")
        );
        return mapToResponse(saved);
    }

    private OpinionResponse mapToResponse(Opinion opinion) {
        String positionName = "";
        String delegateName = "";
        String avatar = "";

        if (opinion.getUser() != null) {
            delegateName = opinion.getUser().getFullName();
            avatar = opinion.getUser().getAvatar();
            if (opinion.getUser().getPosition() != null) {
                positionName = opinion.getUser().getPosition().getPositionName();
            }
        } else if (opinion.getGuestName() != null) {
            delegateName = opinion.getGuestName() + " (Khách mời)";
        }

        List<OpinionAttachmentResponse> attachments = new ArrayList<>();
        if (opinion.getAttachments() != null) {
            for (Document doc : opinion.getAttachments()) {
                String fileName = doc.getTitle();
                String fileUrl = "";
                if (doc.getCurrentVersion() != null) {
                    fileUrl = doc.getCurrentVersion().getFileUrl();
                    if (doc.getCurrentVersion().getFileName() != null) {
                        fileName = doc.getCurrentVersion().getFileName();
                    }
                }
                attachments.add(OpinionAttachmentResponse.builder()
                        .documentId(doc.getId())
                        .fileName(fileName)
                        .fileUrl(fileUrl)
                        .build());
            }
        }

        return OpinionResponse.builder()
                .id(opinion.getId())
                .delegateName(delegateName)
                .position(positionName)
                .avatar(avatar)
                .content(opinion.getOpinionDetail())
                .time(opinion.getCreatedAt())
                .documentName(opinion.getDocumentName())
                .attachments(attachments)
                .build();
    }

    @Transactional
    public OpinionResponse publicCreateOpinion(MeetingGuest guest, OpinionRequest request) {
        if (guest == null || guest.getMeeting() == null) {
            throw new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND);
        }

        Meeting meeting = guest.getMeeting();
        validateMeetingAllowsOpinion(meeting);
        if (guest.getAttendanceStatus() != AttendanceStatus.PRESENT) {
            throw new AppException(ErrorCode.PARTICIPANT_NOT_PRESENT);
        }

        Opinion opinion = Opinion.builder()
                .meeting(meeting)
                .user(null)
                .guestName(guest.getFullName())
                .opinionDetail(request.getOpinionDetail())
                .documentName(request.getDocumentName())
                .createdAt(LocalDateTime.now())
                .build();

        Opinion saved = opinionRepository.save(opinion);
        return mapToResponse(saved);
    }

    private Meeting getMeeting(UUID meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
    }

    private void validateMeetingAllowsOpinion(Meeting meeting) {
        if (meeting.getStatus() != MeetingStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }
    }

    private void ensureParticipantPresent(UUID meetingId, UUID userId) {
        MeetingParticipant participant = meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHOZIZED));

        if (participant.getAttendanceStatus() != AttendanceStatus.PRESENT) {
            throw new AppException(ErrorCode.PARTICIPANT_NOT_PRESENT);
        }
    }

    private List<Document> resolveMeetingAttachments(UUID meetingId, List<UUID> documentIds) {
        if (documentIds == null || documentIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Opinions may only reference documents already attached to the same meeting.
        List<Document> docs = documentRepository.findAllById(documentIds);
        if (docs.size() != documentIds.size()) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }

        for (Document doc : docs) {
            if (!meetingDocumentRepository.existsByMeetingIdAndDocumentId(meetingId, doc.getId())) {
                throw new AppException(ErrorCode.DOCUMENT_MEETING_NOT_FOUND);
            }
        }

        return docs;
    }
}
