package vn.acme.paperless_meeting.mapper.user;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;

class UserMapperTest {

    private final UserMapper userMapper = Mappers.getMapper(UserMapper.class);

    @Test
    void toResponse_shouldMapPositionAndDepartmentFields() {
        UUID userId = UUID.randomUUID();
        UUID departmentId = UUID.randomUUID();
        UUID parentDepartmentId = UUID.randomUUID();
        UUID positionId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();

        Department parentDepartment = new Department();
        parentDepartment.setId(parentDepartmentId);
        parentDepartment.setDeptName("Parent Department");

        Department department = new Department();
        department.setId(departmentId);
        department.setDeptName("Department A");
        department.setParentDepartment(parentDepartment);

        Position position = new Position();
        position.setId(positionId);
        position.setPositionName("Manager");
        position.setPositionCode("MGR");
        position.setDepartment(department);

        Role role = new Role();
        role.setId(roleId);
        role.setRoleName("USER");

        User user = new User();
        user.setId(userId);
        user.setUsername("user01");
        user.setFullName("User One");
        user.setPosition(position);
        user.setDepartment(department);
        user.setRole(role);

        UserResponse response = userMapper.toResponse(user);

        assertNotNull(response);
        assertEquals(userId, response.getId());
        assertEquals(positionId, response.getPositionId());
        assertEquals("Manager", response.getPositionName());
        assertEquals("MGR", response.getPositionCode());
        assertNotNull(response.getDepartment());
        assertEquals(departmentId, response.getDepartment().getId());
        assertEquals(parentDepartmentId, response.getDepartment().getParentDepartmentId());
        assertNotNull(response.getRole());
        assertEquals(roleId, response.getRole().getId());
        assertEquals("USER", response.getRole().getRoleName());
        assertNotNull(response.getPosition());
        assertEquals(positionId, response.getPosition().getId());
        assertEquals(departmentId, response.getPosition().getDepartmentId());
    }
}