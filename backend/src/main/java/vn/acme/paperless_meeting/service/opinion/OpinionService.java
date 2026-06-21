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
import vn.acme.paperless_meeting.entity.Opinion;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.DocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.OpinionRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OpinionService {

    OpinionRepository opinionRepository;
    MeetingRepository meetingRepository;
    DocumentRepository documentRepository;
    CurrentUserService currentUserService;

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
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        User caller = currentUserService.getCurrentActiveUser();

        Opinion opinion = Opinion.builder()
                .meeting(meeting)
                .user(caller)
                .opinionDetail(request.getOpinionDetail())
                .documentName(request.getDocumentName())
                .createdAt(LocalDateTime.now())
                .build();

        if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
            List<Document> docs = documentRepository.findAllById(request.getDocumentIds());
            if (docs.size() != request.getDocumentIds().size()) {
                throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
            }
            opinion.setAttachments(docs);
        }

        Opinion saved = opinionRepository.save(opinion);
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
    public OpinionResponse publicCreateOpinion(UUID meetingId, String guestName, OpinionRequest request) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        Opinion opinion = Opinion.builder()
                .meeting(meeting)
                .user(null)
                .guestName(guestName)
                .opinionDetail(request.getOpinionDetail())
                .documentName(request.getDocumentName())
                .createdAt(LocalDateTime.now())
                .build();

        Opinion saved = opinionRepository.save(opinion);
        return mapToResponse(saved);
    }
}
