package vn.acme.paperless_meeting.service.document;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import io.minio.MinioClient;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;

/**
 * Unit test cho MinioFileStorageService.
 * 
 * Test validation logic (content type, file size) và URL building.
 * 
 * Lưu ý: MinIO SDK dùng final classes và nội bộ gọi okhttp3.MediaType
 * trong PutObjectArgs.builder().contentType(), nên các test liên quan
 * đến upload thực tế (store success/error path) được đặt trong
 * MinioFileStorageServiceIntegrationTest chạy khi có MinIO.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MinioFileStorageServiceTest {

    @Mock
    MinioClient minioClient;

    @InjectMocks
    MinioFileStorageService storageService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(storageService, "bucket", "test-bucket");
        ReflectionTestUtils.setField(storageService, "minioUrl", "http://localhost:9000");
    }

    // =====================================================================
    // store — validate content type (trước khi gọi MinIO)
    // =====================================================================

    @Test
    void store_InvalidContentType_ThrowsException() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn("application/octet-stream");

        AppException ex = assertThrows(AppException.class, () -> storageService.store(file));
        assertEquals(ErrorCode.FILE_TYPE_NOT_ALLOWED, ex.getErrorCode());
        // Verify MinIO was NEVER called
        verifyNoInteractions(minioClient);
    }

    @Test
    void store_NullContentType_ThrowsException() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn(null);

        AppException ex = assertThrows(AppException.class, () -> storageService.store(file));
        assertEquals(ErrorCode.FILE_TYPE_NOT_ALLOWED, ex.getErrorCode());
        verifyNoInteractions(minioClient);
    }

    @Test
    void store_ExecutableContentType_ThrowsException() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn("application/x-executable");

        AppException ex = assertThrows(AppException.class, () -> storageService.store(file));
        assertEquals(ErrorCode.FILE_TYPE_NOT_ALLOWED, ex.getErrorCode());
    }

    @Test
    void store_HtmlContentType_ThrowsException() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn("text/html");

        AppException ex = assertThrows(AppException.class, () -> storageService.store(file));
        assertEquals(ErrorCode.FILE_TYPE_NOT_ALLOWED, ex.getErrorCode());
    }

    // =====================================================================
    // store — validate file size (trước khi gọi MinIO)
    // =====================================================================

    @Test
    void store_FileSizeExceeded_ThrowsException() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(51L * 1024 * 1024); // 51MB > 50MB limit

        AppException ex = assertThrows(AppException.class, () -> storageService.store(file));
        assertEquals(ErrorCode.FILE_SIZE_EXCEEDED, ex.getErrorCode());
        verifyNoInteractions(minioClient);
    }

    @Test
    void store_FileSizeExactlyAtLimit_DoesNotThrowSizeError() {
        // 50MB exactly — should pass size validation
        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(50L * 1024 * 1024); // exactly 50MB

        // Sẽ fail ở bước MinIO (NoClassDefFoundError) nhưng KHÔNG phải FILE_SIZE_EXCEEDED
        try {
            storageService.store(file);
        } catch (AppException ex) {
            assertNotEquals(ErrorCode.FILE_SIZE_EXCEEDED, ex.getErrorCode());
        } catch (Exception ignored) {
            // Expected — MinIO classpath issue in test env, not a size error
        }
    }

    // =====================================================================
    // delete — logic test (không cần PutObjectArgs)
    // =====================================================================

    @Test
    void delete_Success_NoException() throws Exception {
        doNothing().when(minioClient).removeObject(any());

        assertDoesNotThrow(() -> storageService.delete("some-key.pdf"));
        verify(minioClient).removeObject(any());
    }

    @Test
    void delete_MinIOError_SwallowsException() throws Exception {
        doThrow(new RuntimeException("Connection refused")).when(minioClient).removeObject(any());

        // delete() intentionally swallows exceptions — this is by design
        assertDoesNotThrow(() -> storageService.delete("some-key.pdf"));
    }

    // =====================================================================
    // getFileUrl — pure logic test
    // =====================================================================

    @Test
    void getFileUrl_BuildsCorrectUrl() {
        String url = storageService.getFileUrl("abc123.pdf");
        assertEquals("http://localhost:9000/test-bucket/abc123.pdf", url);
    }

    @Test
    void getFileUrl_MinioUrlWithTrailingSlash() {
        ReflectionTestUtils.setField(storageService, "minioUrl", "http://localhost:9000/");
        String url = storageService.getFileUrl("file.pdf");
        assertEquals("http://localhost:9000/test-bucket/file.pdf", url);
    }

    @Test
    void getFileUrl_StorageKeyWithSubpath() {
        String url = storageService.getFileUrl("2026/05/uuid.docx");
        assertEquals("http://localhost:9000/test-bucket/2026/05/uuid.docx", url);
    }
}
