package vn.acme.paperless_meeting.service.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Kết quả trả về sau khi upload file lên storage.
 */
@Getter
@AllArgsConstructor
@Builder
public class StorageResult {
    private final String storageKey;
    private final String fileUrl;
    private final long fileSize;
    private final String checksum;
    private final String fileName;
}
