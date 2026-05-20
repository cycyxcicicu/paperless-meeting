package vn.acme.paperless_meeting.dto.request.speaker;

import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReorderQueueRequest {
    private List<UUID> queueIds; // danh sách các queueId đã được sắp xếp lại thứ tự mong muốn
}
