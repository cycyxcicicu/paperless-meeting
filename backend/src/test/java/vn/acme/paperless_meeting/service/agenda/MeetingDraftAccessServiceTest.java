package vn.acme.paperless_meeting.service.agenda;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.PositionCode;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.department.DepartmentService;

/**
 * Xác nhận MeetingDraftAccessService (dùng để chặn AI trợ lý lộ nội dung/tài liệu
 * nháp của agenda item chưa công bố) tái hiện đúng quy tắc gốc trong AgendaItemService,
 * mà không cần chèn dữ liệu vào DB thật.
 */
@ExtendWith(MockitoExtension.class)
class MeetingDraftAccessServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentService departmentService;

    @InjectMocks
    private MeetingDraftAccessService service;

    private User creator;
    private User preparer;
    private User regularParticipant;
    private Meeting meeting;
    private AgendaItem agendaItem;

    @BeforeEach
    void setUp() {
        creator = userWithRole(null);
        preparer = userWithRole(null);
        regularParticipant = userWithRole(null);

        meeting = new Meeting();
        meeting.setCreatedBy(creator);

        agendaItem = new AgendaItem();
        agendaItem.setPreparedByUser(preparer);
    }

    private User userWithRole(RoleName roleName) {
        User user = new User();
        user.setId(UUID.randomUUID());
        if (roleName != null) {
            Role role = new Role();
            role.setRoleCode(roleName.getCode());
            user.setRole(role);
        }
        return user;
    }

    @Test
    void publishedMeeting_alwaysVisible_evenToUnrelatedUser() {
        meeting.setStatus(MeetingStatus.IN_PROGRESS);
        assertTrue(service.canViewDraftAgendaItem(meeting, regularParticipant.getId(), agendaItem));
    }

    @Test
    void draftMeeting_creatorCanView() {
        meeting.setStatus(MeetingStatus.DRAFT);
        assertTrue(service.canViewDraftAgendaItem(meeting, creator.getId(), agendaItem));
    }

    @Test
    void draftMeeting_preparerOfThisItemCanView() {
        meeting.setStatus(MeetingStatus.DRAFT);
        assertTrue(service.canViewDraftAgendaItem(meeting, preparer.getId(), agendaItem));
    }

    @Test
    void draftMeeting_superAdminCanView() {
        meeting.setStatus(MeetingStatus.DRAFT);
        User superAdmin = userWithRole(RoleName.SUPER_ADMIN);
        when(userRepository.findById(superAdmin.getId())).thenReturn(java.util.Optional.of(superAdmin));

        assertTrue(service.canViewDraftAgendaItem(meeting, superAdmin.getId(), agendaItem));
    }

    @Test
    void draftMeeting_departmentAdminOfCoveringDeptCanView() {
        meeting.setStatus(MeetingStatus.DRAFT);
        Department meetingDept = new Department();
        meetingDept.setId(UUID.randomUUID());
        meeting.setDepartment(meetingDept);

        User deptAdmin = userWithRole(RoleName.DEPARTMENT_ADMIN);
        Department adminDept = new Department();
        adminDept.setId(UUID.randomUUID());
        deptAdmin.setDepartment(adminDept);

        when(userRepository.findById(deptAdmin.getId())).thenReturn(java.util.Optional.of(deptAdmin));
        when(departmentService.getAllSubDepartmentIds(adminDept.getId()))
                .thenReturn(List.of(adminDept.getId(), meetingDept.getId()));

        assertTrue(service.canViewDraftAgendaItem(meeting, deptAdmin.getId(), agendaItem));
    }

    @Test
    void draftMeeting_departmentAdminOfUnrelatedDeptCannotView() {
        meeting.setStatus(MeetingStatus.DRAFT);
        Department meetingDept = new Department();
        meetingDept.setId(UUID.randomUUID());
        meeting.setDepartment(meetingDept);

        User deptAdmin = userWithRole(RoleName.DEPARTMENT_ADMIN);
        Department adminDept = new Department();
        adminDept.setId(UUID.randomUUID());
        deptAdmin.setDepartment(adminDept);

        when(userRepository.findById(deptAdmin.getId())).thenReturn(java.util.Optional.of(deptAdmin));
        when(departmentService.getAllSubDepartmentIds(adminDept.getId()))
                .thenReturn(List.of(adminDept.getId())); // does NOT cover meetingDept

        assertFalse(service.canViewDraftAgendaItem(meeting, deptAdmin.getId(), agendaItem));
    }

    @Test
    void draftMeeting_leaderPosition_chuTich_ofCoveringDeptCanView() {
        meeting.setStatus(MeetingStatus.DRAFT);
        Department meetingDept = new Department();
        meetingDept.setId(UUID.randomUUID());
        meeting.setDepartment(meetingDept);

        User leader = userWithRole(null);
        Position position = new Position();
        position.setPositionCode(PositionCode.CHU_TICH.getCode());
        leader.setPosition(position);
        Department leaderDept = new Department();
        leaderDept.setId(meetingDept.getId());
        leader.setDepartment(leaderDept);

        when(userRepository.findById(leader.getId())).thenReturn(java.util.Optional.of(leader));
        when(departmentService.getAllSubDepartmentIds(leaderDept.getId()))
                .thenReturn(List.of(leaderDept.getId()));

        assertTrue(service.canViewDraftAgendaItem(meeting, leader.getId(), agendaItem));
    }

    @Test
    void draftMeeting_regularParticipant_cannotView() {
        meeting.setStatus(MeetingStatus.DRAFT);
        when(userRepository.findById(regularParticipant.getId())).thenReturn(java.util.Optional.of(regularParticipant));

        assertFalse(service.canViewDraftAgendaItem(meeting, regularParticipant.getId(), agendaItem));
    }

    @Test
    void draftMeeting_nullCallerId_cannotView() {
        meeting.setStatus(MeetingStatus.DRAFT);
        assertFalse(service.canViewDraftAgendaItem(meeting, null, agendaItem));
    }

    @Test
    void draftMeeting_generalDocumentWithNoAgendaItem_onlyMeetingLevelRulesApply() {
        meeting.setStatus(MeetingStatus.DRAFT);
        // agendaItem = null (tài liệu chung, không gắn nội dung cụ thể) - preparer không áp dụng
        assertTrue(service.canViewDraftAgendaItem(meeting, creator.getId(), null));

        when(userRepository.findById(regularParticipant.getId())).thenReturn(java.util.Optional.of(regularParticipant));
        assertFalse(service.canViewDraftAgendaItem(meeting, regularParticipant.getId(), null));
    }
}
