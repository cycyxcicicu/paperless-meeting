package vn.acme.paperless_meeting.service.document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
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

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InvitationTemplateService {

    DocTemplateRepository docTemplateRepository;
    CurrentUserService currentUserService;

    @Transactional
    public DocTemplateResponse createTemplate(DocTemplateRequest request) {
        if (docTemplateRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.TEMPLATE_CODE_EXISTED);
        }

        User caller = currentUserService.getCurrentActiveUser();

        DocTemplate template = new DocTemplate();
        template.setName(request.getName());
        template.setCode(request.getCode());
        template.setContentJson(request.getContentJson());
        template.setTemplateType(parseTemplateType(request.getTemplateType()));
        template.setStatus(parseDocTemplateStatus(request.getStatus()));
        template.setCreatedAt(LocalDateTime.now());
        template.setCreatedBy(caller);
        template.setOwnerDepartment(caller.getDepartment());

        DocTemplate saved = docTemplateRepository.save(template);
        return mapToResponse(saved);
    }

    @Transactional
    public DocTemplateResponse updateTemplate(UUID id, DocTemplateRequest request) {
        DocTemplate template = docTemplateRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));

        if (docTemplateRepository.existsByCodeAndIdNot(request.getCode(), id)) {
            throw new AppException(ErrorCode.TEMPLATE_CODE_EXISTED);
        }

        template.setName(request.getName());
        template.setCode(request.getCode());
        template.setContentJson(request.getContentJson());
        if (request.getTemplateType() != null) {
            template.setTemplateType(parseTemplateType(request.getTemplateType()));
        }
        if (request.getStatus() != null) {
            template.setStatus(parseDocTemplateStatus(request.getStatus()));
        }

        DocTemplate saved = docTemplateRepository.save(template);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public DocTemplateResponse getTemplate(UUID id) {
        DocTemplate template = docTemplateRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));
        return mapToResponse(template);
    }

    @Transactional(readOnly = true)
    public List<DocTemplateResponse> listTemplates() {
        // Find all non-deleted templates because of @SQLRestriction("is_deleted = false")
        List<DocTemplate> list = docTemplateRepository.findAll();
        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        DocTemplate template = docTemplateRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));

        // Calls repository delete which triggers soft-delete @SQLDelete
        docTemplateRepository.delete(template);
    }

    private DocTemplateResponse mapToResponse(DocTemplate entity) {
        DocTemplateResponse response = new DocTemplateResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setCode(entity.getCode());
        response.setContentJson(entity.getContentJson());
        response.setTemplateType(entity.getTemplateType());
        response.setStatus(entity.getStatus());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }

    private TemplateType parseTemplateType(String typeStr) {
        if (typeStr == null || typeStr.isBlank()) {
            return TemplateType.INVITATION;
        }
        try {
            return TemplateType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return TemplateType.INVITATION;
        }
    }

    private DocTemplateStatus parseDocTemplateStatus(String statusStr) {
        if (statusStr == null || statusStr.isBlank()) {
            return DocTemplateStatus.ACTIVE;
        }
        try {
            return DocTemplateStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return DocTemplateStatus.ACTIVE;
        }
    }
}
