package vn.acme.paperless_meeting.event.meeting;

import java.util.UUID;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class MeetingPublishedEvent extends ApplicationEvent {
    private final UUID meetingId;

    public MeetingPublishedEvent(Object source, UUID meetingId) {
        super(source);
        this.meetingId = meetingId;
    }
}
