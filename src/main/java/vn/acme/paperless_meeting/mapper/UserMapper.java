package vn.acme.paperless_meeting.mapper;

import org.mapstruct.Mapper;

import vn.acme.paperless_meeting.dto.request.RegisterRequest;
import vn.acme.paperless_meeting.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toUser(RegisterRequest request);
}
