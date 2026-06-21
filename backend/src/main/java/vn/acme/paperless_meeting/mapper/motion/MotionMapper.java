package vn.acme.paperless_meeting.mapper.motion;

import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.acme.paperless_meeting.dto.request.motion.MotionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.motion.MotionResponse;
import vn.acme.paperless_meeting.dto.response.motion.VoteOptionResponse;
import vn.acme.paperless_meeting.entity.Motion;
import vn.acme.paperless_meeting.entity.VoteSession;
import vn.acme.paperless_meeting.entity.enums.VoteSessionStatus;
import java.util.Comparator;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface MotionMapper {
    @Mapping(target = "agendaItem", ignore = true)
    @Mapping(target = "meeting", ignore = true)
    Motion toEntity(MotionUpsertRequest request);

    @Mapping(target = "agendaItem", ignore = true)
    @Mapping(target = "meeting", ignore = true)
    void updateEntity(MotionUpsertRequest request, @MappingTarget Motion motion);

    @Mapping(target = "agendaItemId", source = "agendaItem.id")
    @Mapping(target = "agendaItemTitle", source = "agendaItem.title")
    @Mapping(target = "meetingId", source = "meeting.id")
    @Mapping(target = "createdByUserId", source = "createdBy.id")
    @Mapping(target = "createdByFullName", source = "createdBy.fullName")
    @Mapping(target = "options", expression = "java(mapOptions(motion))")
    MotionResponse toResponse(Motion motion);

    default List<VoteOptionResponse> mapOptions(Motion motion) {
        if (motion == null || motion.getVoteSessionList() == null) {
            return null;
        }
        return motion.getVoteSessionList().stream()
                .filter(s -> s.getStatus() == VoteSessionStatus.OPEN)
                .findFirst()
                .or(() -> motion.getVoteSessionList().stream().max(Comparator.comparing(VoteSession::getOpenedAt)))
                .map(s -> s.getVoteOptionList().stream()
                        .map(o -> VoteOptionResponse.builder()
                                .id(o.getId())
                                .label(o.getLabel())
                                .orderNo(o.getOrderNo())
                                .build())
                        .collect(Collectors.toList()))
                .orElse(null);
    }
}
