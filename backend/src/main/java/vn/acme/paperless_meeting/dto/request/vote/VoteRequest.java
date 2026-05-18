package vn.acme.paperless_meeting.dto.request.vote;

import java.util.UUID;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VoteRequest {
    @NotNull(message = "Vui lòng chọn phương án biểu quyết")
    private UUID optionId;
}
