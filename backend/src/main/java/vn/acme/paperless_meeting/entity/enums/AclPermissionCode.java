package vn.acme.paperless_meeting.entity.enums;

// - VIEW: Cho phép xem tài nguyên.
// - DOWNLOAD: Cho phép tải xuống tài nguyên.
// - EDIT: Cho phép chỉnh sửa tài nguyên.
// - SHARE: Cho phép chia sẻ tài nguyên với người khác.
// - APPROVE: Cho phép phê duyệt tài nguyên (ví dụ: phê duyệt cuộc họp, tài liệu).
public enum AclPermissionCode {
    VIEW,
    DOWNLOAD,
    EDIT,
    SHARE,
    APPROVE,
    MANAGE,
    VIEW_RESULT
}
