package vn.acme.paperless_meeting.service.document;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.GetObjectArgs;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;

import java.io.InputStream;
import java.util.Set;
import java.util.UUID;

/**
 * Triển khai FileStorageService dùng MinIO.
 * - Upload file → lưu vào bucket MinIO, trả về URL public.
 * - storageKey = UUID ngẫu nhiên + phần mở rộng gốc (tránh path traversal).
 * - fileUrl = <minio.url>/<bucket>/<storageKey> (URL direct access).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MinioFileStorageService implements FileStorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.url}")
    private String minioUrl;

    /** Các loại file được phép upload */
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "image/png",
            "image/jpeg",
            "image/jpg",
            "text/plain",
            "application/zip"
    );

    /** Kích thước file tối đa: 20MB */
    private static final long MAX_FILE_SIZE = 20L * 1024 * 1024;

    /**
     * Khởi tạo bucket nếu chưa tồn tại khi ứng dụng start.
     */
    @PostConstruct
    public void initBucket() {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Đã tạo bucket MinIO: {}", bucket);
            } else {
                log.info("Bucket MinIO '{}' đã tồn tại.", bucket);
            }
        } catch (Exception e) {
            log.error("Khởi tạo bucket MinIO '{}' thất bại: {}", bucket, e.getMessage(), e);
            // Không throw để tránh block app start; lỗi sẽ xuất hiện khi upload thực sự
        }
    }

    @Override
    public StorageResult store(MultipartFile file) {
        // 1. Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }

        // 2. Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

        // 3. Tạo storageKey = UUID + extension (tránh path traversal)
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex); // vd: ".pdf"
        }
        String storageKey = UUID.randomUUID() + extension;

        // 4. Upload lên MinIO
        try (InputStream inputStream = file.getInputStream()) {
            // Tính checksum MD5 từ bytes (đọc riêng)
            byte[] bytes = file.getBytes();
            String checksum = DigestUtils.md5Hex(bytes);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(storageKey)
                            .stream(inputStream, file.getSize(), -1L)
                            .contentType(contentType)
                            .build()
            );

            String fileUrl = buildFileUrl(storageKey);
            log.info("Đã tải file lên thành công '{}' → storageKey='{}', dung lượng={} bytes", originalFilename, storageKey, file.getSize());

            return StorageResult.builder()
                    .storageKey(storageKey)
                    .fileUrl(fileUrl)
                    .fileSize(file.getSize())
                    .checksum(checksum)
                    .fileName(originalFilename)
                    .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Tải file '{}' lên MinIO thất bại: {}", originalFilename, e.getMessage(), e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucket)
                            .object(storageKey)
                            .build()
            );
            log.info("Đã xóa file storageKey='{}' khỏi MinIO", storageKey);
        } catch (Exception e) {
            log.warn("Xóa file storageKey='{}' khỏi MinIO thất bại: {}", storageKey, e.getMessage());
            // Không throw — lỗi xóa file không được block flow chính
        }
    }

    @Override
    public String getFileUrl(String storageKey) {
        return buildFileUrl(storageKey);
    }

    @Override
    public InputStream getFileStream(String storageKey) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucket)
                            .object(storageKey)
                            .build()
            );
        } catch (Exception e) {
            log.error("Đọc luồng dữ liệu file từ MinIO thất bại: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    // --- Private helpers ---

    private String buildFileUrl(String storageKey) {
        // URL direct access: http://localhost:9000/uploads/abc.pdf
        return minioUrl.replaceAll("/$", "") + "/" + bucket + "/" + storageKey;
    }
}
