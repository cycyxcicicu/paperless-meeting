package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.entity.Document;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    /**
     * Lấy danh sách tài liệu của user, kèm JOIN FETCH currentVersion và createdBy
     * để tránh N+1 query khi map sang DocumentResponse.
     */
    @Query("SELECT d FROM Document d " +
           "LEFT JOIN FETCH d.currentVersion cv " +
           "LEFT JOIN FETCH d.createdBy u " +
           "WHERE d.createdBy.id = :userId " +
           "ORDER BY d.createdAt DESC")
    List<Document> findByCreatedByIdWithVersion(@Param("userId") UUID userId);

    /**
     * Kiểm tra tài liệu có đang được gắn vào bất kỳ meeting nào không.
     * Dùng trước khi xóa Document để bảo vệ toàn vẹn dữ liệu.
     */
    @Query("SELECT COUNT(md) > 0 FROM MeetingDocument md WHERE md.document.id = :documentId")
    boolean isAttachedToAnyMeeting(@Param("documentId") UUID documentId);
}
