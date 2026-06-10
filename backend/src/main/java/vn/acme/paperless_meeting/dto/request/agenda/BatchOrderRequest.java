package vn.acme.paperless_meeting.dto.request.agenda;

import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BatchOrderRequest {

    @NotNull(message = "Danh sách sắp xếp không được để trống")
    @Valid
    List<AgendaOrderDto> orders;

    @Getter
    @Setter
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class AgendaOrderDto {
        @NotNull(message = "ID agenda không được để trống")
        UUID id;

        @NotNull(message = "Order no không được để trống")
        Integer orderNo;
    }
}
