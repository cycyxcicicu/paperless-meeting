package vn.acme.paperless_meeting.dto.request.meetingparticipant;

import java.util.UUID;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;

@Getter
@Setter
public class UpdateInviteStatusRequest {
    @NotNull(message = "INVITE_STATUS_REQUIRED")
    private InviteStatus inviteStatus;

    private String declineReason;

    private UUID substituteUserId;

    private String substituteName;
    private String substitutePosition;
    private String substituteCompany;
    private String substituteDepartment;
    private String substituteEmail;
    private String substitutePhone;

    private Boolean isFullSession;
    private List<UUID> absentAgendaItemIds;
}
