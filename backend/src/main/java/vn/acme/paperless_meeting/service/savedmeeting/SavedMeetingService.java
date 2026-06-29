package vn.acme.paperless_meeting.service.savedmeeting;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.SavedMeeting;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.SavedMeetingRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.meeting.MeetingService;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SavedMeetingService {

    SavedMeetingRepository savedMeetingRepository;
    MeetingRepository meetingRepository;
    CurrentUserService currentUserService;
    MeetingService meetingService;

    @Transactional
    public boolean toggleSaveMeeting(UUID meetingId) {
        User caller = currentUserService.getCurrentActiveUser();
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        var savedOpt = savedMeetingRepository.findByUserIdAndMeetingId(caller.getId(), meetingId);
        if (savedOpt.isPresent()) {
            savedMeetingRepository.delete(savedOpt.get());
            log.info("User {} unsaved meeting {}", caller.getId(), meetingId);
            return false; // Removed bookmark
        } else {
            SavedMeeting savedMeeting = SavedMeeting.builder()
                    .user(caller)
                    .meeting(meeting)
                    .build();
            savedMeetingRepository.save(savedMeeting);
            log.info("User {} saved meeting {}", caller.getId(), meetingId);
            return true; // Added bookmark
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<MeetingResponse> getSavedMeetings(Pageable pageable) {
        User caller = currentUserService.getCurrentActiveUser();
        Page<SavedMeeting> page = savedMeetingRepository.findByUserIdWithMeetings(caller.getId(), pageable);
        
        // Convert Page<SavedMeeting> to Page<Meeting> so we can reuse MeetingService.toPageResponse
        Page<Meeting> meetingPage = page.map(SavedMeeting::getMeeting);
        
        return meetingService.toPageResponse(meetingPage);
    }

    @Transactional(readOnly = true)
    public boolean isMeetingSaved(UUID meetingId) {
        User caller = currentUserService.getCurrentActiveUser();
        return savedMeetingRepository.existsByUserIdAndMeetingId(caller.getId(), meetingId);
    }
}
