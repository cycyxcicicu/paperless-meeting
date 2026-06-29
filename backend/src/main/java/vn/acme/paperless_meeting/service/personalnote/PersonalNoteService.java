package vn.acme.paperless_meeting.service.personalnote;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.personalnote.PersonalNoteRequest;
import vn.acme.paperless_meeting.dto.response.personalnote.PersonalNoteResponse;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.PersonalNote;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.PersonalNoteRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PersonalNoteService {

    PersonalNoteRepository personalNoteRepository;
    MeetingRepository meetingRepository;
    AgendaItemRepository agendaItemRepository;
    CurrentUserService currentUserService;

    @Transactional
    public PersonalNoteResponse createNote(PersonalNoteRequest request) {
        User caller = currentUserService.getCurrentActiveUser();
        Meeting meeting = meetingRepository.findById(request.getMeetingId())
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        AgendaItem agendaItem = null;
        if (request.getAgendaItemId() != null) {
            agendaItem = agendaItemRepository.findById(request.getAgendaItemId())
                    .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));
            if (!agendaItem.getMeeting().getId().equals(meeting.getId())) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }
        }

        PersonalNote note = PersonalNote.builder()
                .user(caller)
                .meeting(meeting)
                .agendaItem(agendaItem)
                .noteContent(request.getNoteContent())
                .build();

        note = personalNoteRepository.save(note);
        log.info("User {} created note {} for meeting {}", caller.getId(), note.getId(), meeting.getId());

        return mapToResponse(note);
    }

    @Transactional
    public PersonalNoteResponse updateNote(UUID noteId, PersonalNoteRequest request) {
        User caller = currentUserService.getCurrentActiveUser();
        PersonalNote note = personalNoteRepository.findByIdAndUserId(noteId, caller.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        note.setNoteContent(request.getNoteContent());
        note = personalNoteRepository.save(note);
        log.info("User {} updated note {}", caller.getId(), noteId);

        return mapToResponse(note);
    }

    @Transactional
    public void deleteNote(UUID noteId) {
        User caller = currentUserService.getCurrentActiveUser();
        PersonalNote note = personalNoteRepository.findByIdAndUserId(noteId, caller.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        personalNoteRepository.delete(note);
        log.info("User {} deleted note {}", caller.getId(), noteId);
    }

    @Transactional(readOnly = true)
    public List<PersonalNoteResponse> getNotesForMeeting(UUID meetingId) {
        User caller = currentUserService.getCurrentActiveUser();
        List<PersonalNote> notes = personalNoteRepository.findByUserIdAndMeetingIdOrderByCreatedAtDesc(caller.getId(), meetingId);
        return notes.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<PersonalNoteResponse> getAllNotes(Pageable pageable) {
        User caller = currentUserService.getCurrentActiveUser();
        Page<PersonalNote> page = personalNoteRepository.findByUserIdWithMeetings(caller.getId(), pageable);

        List<PersonalNoteResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<PersonalNoteResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private PersonalNoteResponse mapToResponse(PersonalNote note) {
        return PersonalNoteResponse.builder()
                .id(note.getId())
                .meetingId(note.getMeeting().getId())
                .meetingTitle(note.getMeeting().getTitle())
                .agendaItemId(note.getAgendaItem() != null ? note.getAgendaItem().getId() : null)
                .agendaItemTitle(note.getAgendaItem() != null ? note.getAgendaItem().getTitle() : null)
                .noteContent(note.getNoteContent())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
