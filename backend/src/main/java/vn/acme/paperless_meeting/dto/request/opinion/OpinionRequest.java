package vn.acme.paperless_meeting.dto.request.opinion;

import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OpinionRequest {
    @NotBlank(message = "Nội dung ý kiến đóng góp không được để trống")
    String opinionDetail;
    String documentName;
    List<UUID> documentIds;
}
