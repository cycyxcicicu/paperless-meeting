package vn.acme.paperless_meeting.dto.response.meeting;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MeetingInvitationPreviewResponse {
    private String headerTrai;
    private String headerPhai;
    private String ngayThang;
    private String tieuDe;
    private String trichYeu;
    private String noiDung;
    private String chuKy;
}
