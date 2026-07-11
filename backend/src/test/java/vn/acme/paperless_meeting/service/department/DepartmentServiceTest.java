package vn.acme.paperless_meeting.service.department;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.acme.paperless_meeting.dto.request.department.DepartmentUpsertRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentResponse;
import vn.acme.paperless_meeting.dto.response.department.DepartmentTreeResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.AppValidationException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.department.DepartmentMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    DepartmentRepository departmentRepository;
    @Mock
    DepartmentMapper departmentMapper;
    @Mock
    CurrentUserService currentUserService;
    @Mock
    UserRepository userRepository;
    @Mock
    AuditLogPublisher auditLogPublisher;

    @InjectMocks
    DepartmentService departmentService;

    private User caller;
    private Department rootDept;
    private Department childDept;

    @BeforeEach
    void setUp() {
        caller = new User();
        caller.setId(UUID.randomUUID());

        rootDept = new Department();
        rootDept.setId(UUID.randomUUID());
        rootDept.setDeptName("UBND Hải Phòng");
        rootDept.setCode("UBND");

        childDept = new Department();
        childDept.setId(UUID.randomUUID());
        childDept.setDeptName("Sở Nội Vụ");
        childDept.setCode("SNV");
        childDept.setParentDepartment(rootDept);
    }

    @Test
    void getTree_asSuperAdmin_shouldReturnFullTree() {
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);

        List<Department> allDepts = List.of(rootDept, childDept);
        when(departmentRepository.findAll()).thenReturn(allDepts);

        List<DepartmentTreeResponse> tree = departmentService.getTree(false);

        assertNotNull(tree);
        assertEquals(1, tree.size()); // Root node only
        assertEquals(rootDept.getId(), tree.get(0).getId());
        assertEquals(1, tree.get(0).getChildren().size());
        assertEquals(childDept.getId(), tree.get(0).getChildren().get(0).getId());
    }

    @Test
    void getTree_asDepartmentAdmin_shouldReturnSubTree() {
        caller.setDepartment(childDept);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);
        when(currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)).thenReturn(true);

        List<Department> allDepts = List.of(rootDept, childDept);
        when(departmentRepository.findAll()).thenReturn(allDepts);

        List<DepartmentTreeResponse> tree = departmentService.getTree(false);

        assertNotNull(tree);
        assertEquals(1, tree.size());
        assertEquals(childDept.getId(), tree.get(0).getId());
    }

    @Test
    void create_asUserRole_shouldThrowUnauthorized() {
        when(currentUserService.hasRole(RoleName.USER)).thenReturn(true);

        DepartmentUpsertRequest request = new DepartmentUpsertRequest();
        request.setDeptName("Phòng mới");
        request.setCode("PM");

        assertThrows(AppException.class, () -> departmentService.create(request));
    }

    @Test
    void create_asSuperAdmin_withValidRequest_shouldSucceed() {
        when(currentUserService.hasRole(RoleName.USER)).thenReturn(false);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        DepartmentUpsertRequest request = new DepartmentUpsertRequest();
        request.setDeptName("Sở Tài Chính");
        request.setCode("STC");

        when(departmentRepository.existsByDeptNameAndParentDepartmentIsNull("Sở Tài Chính")).thenReturn(false);

        Department savedDept = new Department();
        savedDept.setId(UUID.randomUUID());
        savedDept.setDeptName("Sở Tài Chính");
        savedDept.setCode("STC");

        when(departmentMapper.toEntity(request)).thenReturn(savedDept);
        when(departmentRepository.save(any(Department.class))).thenReturn(savedDept);

        DepartmentResponse mockResponse = DepartmentResponse.builder()
                .id(savedDept.getId())
                .deptName("Sở Tài Chính")
                .code("STC")
                .build();
        when(departmentMapper.toResponse(savedDept)).thenReturn(mockResponse);

        DepartmentResponse response = departmentService.create(request);

        assertNotNull(response);
        assertEquals("Sở Tài Chính", response.getDeptName());
        verify(auditLogPublisher, times(1)).publish(any(), any(), any(), any(), any());
    }

    @Test
    void create_withDuplicateName_shouldThrowValidationException() {
        when(currentUserService.hasRole(RoleName.USER)).thenReturn(false);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        DepartmentUpsertRequest request = new DepartmentUpsertRequest();
        request.setDeptName("Sở Nội Vụ");
        request.setCode("SNV");
        request.setParentDepartmentId(rootDept.getId());

        when(departmentRepository.existsByDeptNameAndParentDepartment_Id("Sở Nội Vụ", rootDept.getId())).thenReturn(true);

        assertThrows(AppValidationException.class, () -> departmentService.create(request));
    }

    @Test
    void update_withSelfParentReference_shouldThrowBadRequest() {
        when(currentUserService.hasRole(RoleName.USER)).thenReturn(false);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(departmentRepository.findById(rootDept.getId())).thenReturn(Optional.of(rootDept));

        DepartmentUpsertRequest request = new DepartmentUpsertRequest();
        request.setDeptName("UBND Hải Phòng updated");
        request.setCode("UBND");
        request.setParentDepartmentId(rootDept.getId()); // Self parent reference

        assertThrows(AppException.class, () -> departmentService.update(rootDept.getId(), request));
    }

    @Test
    void delete_whenDepartmentHasUsers_shouldThrowAppException() {
        when(currentUserService.hasRole(RoleName.USER)).thenReturn(false);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);
        when(departmentRepository.findById(childDept.getId())).thenReturn(Optional.of(childDept));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        // childDept has sub-departments mock
        when(departmentRepository.findIdsByParentDepartmentIdIn(anyList())).thenReturn(Collections.emptyList());

        // mock user existence
        when(userRepository.existsByDepartmentIdIn(anyList())).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () -> departmentService.delete(childDept.getId()));
        assertEquals(ErrorCode.DEPARTMENT_HAS_USERS, exception.getErrorCode());
    }

    @Test
    void delete_whenDepartmentIsEmpty_shouldSucceed() {
        when(currentUserService.hasRole(RoleName.USER)).thenReturn(false);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);
        when(departmentRepository.findById(childDept.getId())).thenReturn(Optional.of(childDept));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        when(departmentRepository.findIdsByParentDepartmentIdIn(anyList())).thenReturn(Collections.emptyList());
        when(userRepository.existsByDepartmentIdIn(anyList())).thenReturn(false);

        assertDoesNotThrow(() -> departmentService.delete(childDept.getId()));
        verify(departmentRepository, times(1)).softDeleteByIds(anyList(), any());
        verify(auditLogPublisher, times(1)).publish(any(), any(), any(), any(), any());
    }
}
