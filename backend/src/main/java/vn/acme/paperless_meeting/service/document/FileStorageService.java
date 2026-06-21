package vn.acme.paperless_meeting.service.document;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface trừu tượng cho dịch vụ lưu trữ file.
 * Hiện tại dùng MinIO, sau này dễ dàng swap sang S3 hoặc local disk
 * mà không cần thay đổi Service/Controller.
 */
public interface FileStorageService {

    /**
     * Upload file lên storage và trả về kết quả gồm URL, storageKey, fileSize, checksum.
     */
    StorageResult store(MultipartFile file);

    /**
     * Xóa file khỏi storage theo storageKey.
     */
    void delete(String storageKey);

    /**
     * Lấy URL public/presigned để download file.
     */
    String getFileUrl(String storageKey);

    /**
     * Lấy stream file từ storage.
     */
    java.io.InputStream getFileStream(String storageKey);
}
