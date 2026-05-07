package vn.acme.paperless_meeting.entity.enums;

// Nó định nghĩa các loại chủ thể (principal) có thể được gán quyền truy cập trong hệ thống ACL (Access Control List). Các loại chủ thể này có thể là người dùng cụ thể, vai trò hoặc phòng ban. Cụ thể:
// - USER: Đại diện cho một người dùng cụ thể trong hệ thống, có thể là nhân viên, quản lý, hoặc bất kỳ ai có tài khoản trong hệ thống.
// - ROLE: Đại diện cho một vai trò hoặc nhóm người dùng, ví dụ: "
//   - ADMIN: Vai trò quản trị viên, có quyền truy cập và quản lý tất cả các tài nguyên trong hệ thống.
//   - MEMBER: Vai trò thành viên, có quyền truy cập hạn chế hơn so với ADMIN, thường chỉ có quyền truy cập vào các tài nguyên liên quan đến mình.
//   - GUEST: Vai trò khách, có quyền truy cập rất hạn chế, thường chỉ có thể xem một số tài nguyên công khai hoặc được chia sẻ cụ thể.
// - DEPARTMENT: Đại diện cho một phòng ban hoặc bộ phận trong tổ chức, có thể được sử dụng để cấp quyền truy cập
public enum AclPrincipalType {
    USER,
    ROLE,
    DEPARTMENT
}
