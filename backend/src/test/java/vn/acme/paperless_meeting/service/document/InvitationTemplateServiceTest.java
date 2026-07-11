package vn.acme.paperless_meeting.service.document;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.acme.paperless_meeting.dto.request.document.DocTemplateRequest;
import vn.acme.paperless_meeting.dto.response.document.DocTemplateResponse;
import vn.acme.paperless_meeting.entity.DocTemplate;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.DocTemplateStatus;
import vn.acme.paperless_meeting.entity.enums.TemplateType;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.DocTemplateRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

@ExtendWith(MockitoExtension.class)
class InvitationTemplateServiceTest {

    @Mock
    DocTemplateRepository docTemplateRepository;

    @Mock
    CurrentUserService currentUserService;

    @InjectMocks
    InvitationTemplateService invitationTemplateService;

    private User caller;
    private DocTemplate docTemplate;

    @BeforeEach
    void setUp() {
        caller = new User();
        caller.setId(UUID.randomUUID());

        docTemplate = new DocTemplate();
        docTemplate.setId(UUID.randomUUID());
        docTemplate.setName("Mẫu thư mời chuẩn");
        docTemplate.setCode("INV_STD");
        docTemplate.setContentJson("{}");
        docTemplate.setTemplateType(TemplateType.INVITATION);
        docTemplate.setStatus(DocTemplateStatus.ACTIVE);
        docTemplate.setCreatedAt(LocalDateTime.now());
        docTemplate.setCreatedBy(caller);
    }

    @Test
    void createTemplate_withDuplicateCode_shouldThrowAppException() {
        DocTemplateRequest request = new DocTemplateRequest();
        request.setCode("INV_STD");

        when(docTemplateRepository.existsByCode("INV_STD")).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () -> invitationTemplateService.createTemplate(request));
        assertEquals(ErrorCode.TEMPLATE_CODE_EXISTED, exception.getErrorCode());
    }

    @Test
    void createTemplate_withValidRequest_shouldSucceed() {
        DocTemplateRequest request = new DocTemplateRequest();
        request.setName("Mẫu thư mời mới");
        request.setCode("INV_NEW");
        request.setContentJson("{ \"header\": \"Welcome\" }");
        request.setTemplateType("INVITATION");
        request.setStatus("ACTIVE");

        when(docTemplateRepository.existsByCode("INV_NEW")).thenReturn(false);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        DocTemplate savedTemplate = new DocTemplate();
        savedTemplate.setId(UUID.randomUUID());
        savedTemplate.setName(request.getName());
        savedTemplate.setCode(request.getCode());
        savedTemplate.setContentJson(request.getContentJson());
        savedTemplate.setTemplateType(TemplateType.INVITATION);
        savedTemplate.setStatus(DocTemplateStatus.ACTIVE);
        savedTemplate.setCreatedAt(LocalDateTime.now());

        when(docTemplateRepository.save(any(DocTemplate.class))).thenReturn(savedTemplate);

        DocTemplateResponse response = invitationTemplateService.createTemplate(request);

        assertNotNull(response);
        assertEquals("INV_NEW", response.getCode());
        assertEquals("Mẫu thư mời mới", response.getName());
    }

    @Test
    void updateTemplate_whenTemplateNotFound_shouldThrowAppException() {
        UUID id = UUID.randomUUID();
        DocTemplateRequest request = new DocTemplateRequest();

        when(docTemplateRepository.findById(id)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () -> invitationTemplateService.updateTemplate(id, request));
        assertEquals(ErrorCode.TEMPLATE_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void updateTemplate_withDuplicateCodeOnOtherTemplate_shouldThrowAppException() {
        UUID id = docTemplate.getId();
        DocTemplateRequest request = new DocTemplateRequest();
        request.setCode("INV_DUP");

        when(docTemplateRepository.findById(id)).thenReturn(Optional.of(docTemplate));
        when(docTemplateRepository.existsByCodeAndIdNot("INV_DUP", id)).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () -> invitationTemplateService.updateTemplate(id, request));
        assertEquals(ErrorCode.TEMPLATE_CODE_EXISTED, exception.getErrorCode());
    }

    @Test
    void listTemplates_shouldReturnAllTemplates() {
        when(docTemplateRepository.findAll()).thenReturn(List.of(docTemplate));

        List<DocTemplateResponse> list = invitationTemplateService.listTemplates();

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("INV_STD", list.get(0).getCode());
    }

    @Test
    void deleteTemplate_whenTemplateExists_shouldSucceed() {
        UUID id = docTemplate.getId();
        when(docTemplateRepository.findById(id)).thenReturn(Optional.of(docTemplate));

        assertDoesNotThrow(() -> invitationTemplateService.deleteTemplate(id));
        verify(docTemplateRepository, times(1)).delete(docTemplate);
    }
}
