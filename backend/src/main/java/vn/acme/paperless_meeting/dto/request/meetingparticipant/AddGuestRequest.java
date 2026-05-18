package vn.acme.paperless_meeting.dto.request.meetingparticipant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddGuestRequest {

    @NotBlank(message = "FULL_NAME_REQUIRED")
    private String fullName;

    private String gender;

    @NotBlank(message = "EMAIL_REQUIRED")
    @Email(message = "EMAIL_INVALID")
    private String email;

    private String phone;

    private String company;

    private String position;

    private String description;

    private String note;
}
