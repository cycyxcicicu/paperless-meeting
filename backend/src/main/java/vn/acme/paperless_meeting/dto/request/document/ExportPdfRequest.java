package vn.acme.paperless_meeting.dto.request.document;

import java.util.Map;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExportPdfRequest {
    private Map<String, Object> templateData;
    private Map<String, String> sampleData;
}
