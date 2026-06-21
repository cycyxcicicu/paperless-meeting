package vn.acme.paperless_meeting.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@SuppressWarnings("FieldMayBeFinal")
@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public enum ErrorCode implements BaseErrorCode {
        // SYSTEM
        UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
        BAD_REQUEST(4000, "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
        INVALID_DATE_TIME_FORMAT(4001, "Định dạng ngày giờ không hợp lệ", HttpStatus.BAD_REQUEST),
        // AUTH
        UNAUTHENTICATED(1001, "Chưa xác thực", HttpStatus.UNAUTHORIZED),
        UNAUTHOZIZED(1003, "Bạn không có quyền truy cập", HttpStatus.FORBIDDEN),
        INVALID_KEY(1002, "Khóa xác thực không hợp lệ", HttpStatus.BAD_REQUEST),
        TOKEN_EXPIRED(1004, "Phiên đăng nhập đã hết hạn", HttpStatus.UNAUTHORIZED),
        PASSWORD_REQUIRED(1005, "Vui lòng nhập mật khẩu", HttpStatus.BAD_REQUEST),
        USERNAME_REQUIRED(1006, "Vui lòng nhập tên đăng nhập", HttpStatus.BAD_REQUEST),
        USER_FULLNAME_REQUIRED(1007, "Vui lòng nhập họ và tên", HttpStatus.BAD_REQUEST),
        USER_EMAIL_REQUIRED(1008, "Vui lòng nhập email", HttpStatus.BAD_REQUEST),
        USER_PHONE_REQUIRED(1009, "Vui lòng nhập số điện thoại", HttpStatus.BAD_REQUEST),
        USER_STATUS_REQUIRED(1010, "Vui lòng chọn trạng thái người dùng", HttpStatus.BAD_REQUEST),
        USER_EMAIL_INVALID(1011, "Định dạng email không hợp lệ", HttpStatus.BAD_REQUEST),
        DEPARTMENT_NAME_REQUIRED(1012, "Vui lòng nhập tên phòng ban", HttpStatus.BAD_REQUEST),
        DEPARTMENT_ID_REQUIRED(1017, "Vui lòng chọn phòng ban", HttpStatus.BAD_REQUEST),
        LOCATION_NAME_REQUIRED(1013, "Vui lòng nhập tên địa điểm", HttpStatus.BAD_REQUEST),
        LOCATION_TYPE_REQUIRED(1014, "Vui lòng chọn loại địa điểm", HttpStatus.BAD_REQUEST),
        ROLE_NAME_REQUIRED(1015, "Vui lòng nhập tên vai trò", HttpStatus.BAD_REQUEST),
        PERMISSION_CODE_REQUIRED(1016, "Vui lòng nhập mã quyền", HttpStatus.BAD_REQUEST),
        PASSWORD_CHANGE_REQUIRED(1018, "Bạn phải đổi mật khẩu trong lần đăng nhập đầu tiên.", HttpStatus.FORBIDDEN),

        // REGISTER
        OTP_NOT_FOUND(1501, "Mã OTP không tồn tại hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
        OTP_INVALID(1502, "Mã OTP không hợp lệ", HttpStatus.BAD_REQUEST),
        ROLE_NOT_FOUND(1302, "Không tìm thấy vai trò người dùng", HttpStatus.INTERNAL_SERVER_ERROR),
        USER_INFO_EXISTED(1104, "Tên đăng nhập, email hoặc số điện thoại đã tồn tại", HttpStatus.CONFLICT),
        // VALIDATION
        NAME_INVALID(1201, "Tên phải có độ dài từ 3 ký tự trở lên", HttpStatus.BAD_REQUEST),
        PASSWORD_INVALID(1202, "Mật khẩu phải có độ dài từ 8 ký tự trở lên", HttpStatus.BAD_REQUEST),
        // USER
        USER_NOT_EXISTED(1101, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
        USER_EXISTED(1102, "Người dùng đã tồn tại", HttpStatus.CONFLICT),
        USER_NOT_ACTIVE(1103, "Tài khoản người dùng đã bị khóa hoặc không hoạt động", HttpStatus.FORBIDDEN),
        EMAIL_EXISTED(1103, "Email đã tồn tại", HttpStatus.CONFLICT),
        PHONE_EXISTED(1104, "Số điện thoại đã tồn tại", HttpStatus.CONFLICT),
        // DEPARTMENT
        DEPARTMENT_NOT_EXIST(1203, "Phòng ban không tồn tại", HttpStatus.NOT_FOUND),
        DEPARTMENT_EXISTED(1204, "Phòng ban đã tồn tại", HttpStatus.CONFLICT),
        DEPARTMENT_HAS_USERS(1250, "Không thể xóa đơn vị khi vẫn còn cán bộ trực thuộc", HttpStatus.CONFLICT),
        // LOCATION
        LOCATION_NOT_EXIST(1205, "Địa điểm không tồn tại", HttpStatus.NOT_FOUND),
        // MEETING
        MEETING_NOT_EXIST(1206, "Cuộc họp không tồn tại", HttpStatus.NOT_FOUND),
        MEETING_TITLE_REQUIRED(1207, "Vui lòng nhập tiêu đề cuộc họp", HttpStatus.BAD_REQUEST),
        MEETING_TITLE_INVALID(1208, "Tiêu đề cuộc họp không hợp lệ", HttpStatus.BAD_REQUEST),
        MEETING_DESCRIPTION_INVALID(1209, "Mô tả cuộc họp không hợp lệ", HttpStatus.BAD_REQUEST),
        MEETING_START_TIME_REQUIRED(1210, "Vui lòng chọn thời gian bắt đầu", HttpStatus.BAD_REQUEST),
        MEETING_END_TIME_REQUIRED(1211, "Vui lòng chọn thời gian kết thúc", HttpStatus.BAD_REQUEST),
        MEETING_LOCATION_REQUIRED(1212, "Vui lòng chọn địa điểm họp", HttpStatus.BAD_REQUEST),
        MEETING_STATUS_REQUIRED(1213, "Vui lòng chọn trạng thái cuộc họp", HttpStatus.BAD_REQUEST),
        MEETING_CANCEL_REASON_REQUIRED(1214, "Vui lòng nhập lý do hủy", HttpStatus.BAD_REQUEST),
        MEETING_CANCEL_REASON_INVALID(1215, "Lý do hủy không hợp lệ", HttpStatus.BAD_REQUEST),
        MEETING_INVALID_TIME_RANGE(1216, "Thời gian kết thúc phải sau thời gian bắt đầu", HttpStatus.BAD_REQUEST),
        MEETING_INVALID_CHECKIN_TIME_RANGE(1217, "Khoảng thời gian điểm danh không hợp lệ", HttpStatus.BAD_REQUEST),
        MEETING_INVALID_LATE_AFTER_MINUTES(1218, "Số phút tính đi trễ không hợp lệ", HttpStatus.BAD_REQUEST),
        MEETING_STATUS_TRANSITION_INVALID(1219, "Trạng thái chuyển đổi không hợp lệ", HttpStatus.BAD_REQUEST),
        MEETING_ONLY_DRAFT_ALLOWED(1220, "Hành động này chỉ cho phép khi cuộc họp ở trạng thái NHÁP",
                        HttpStatus.BAD_REQUEST),
        MEETING_ALREADY_CLOSED_OR_CANCELLED(1221, "Cuộc họp đã kết thúc hoặc đã hủy", HttpStatus.BAD_REQUEST),
        MEETING_MUST_BE_SCHEDULED_BEFORE_30_MINUTES(1222, "Cuộc họp phải được lên lịch trước ít nhất 30 phút",
                        HttpStatus.BAD_REQUEST),
        MEETING_LOCATION_OR_TIME_REQUIRED(1223, "Vui lòng nhập địa điểm hoặc thời gian", HttpStatus.BAD_REQUEST),
        MEETING_LOCATION_TIME_CONFLICT(1224, "Địa điểm hoặc thời gian bị trùng lịch với cuộc họp khác",
                        HttpStatus.BAD_REQUEST),
        MEETING_CANNOT_CANCEL_IN_CURRENT_STATUS(1225, "Không thể hủy cuộc họp ở trạng thái hiện tại",
                        HttpStatus.BAD_REQUEST),
        MEETING_CHECKIN_OPEN_TIME_INVALID(1226,
                        "Thời gian bắt đầu điểm danh phải trước giờ họp và tối đa 30 phút trước đó",
                        HttpStatus.BAD_REQUEST),
        MEETING_CHECKIN_CLOSE_TIME_INVALID(1227,
                        "Thời gian kết thúc điểm danh phải sau giờ họp và tối đa 15 phút sau đó",
                        HttpStatus.BAD_REQUEST),
        MEETING_LATE_AFTER_MINUTES_EXCEEDS_CHECKIN_CLOSE(1228,
                        "Thời hạn đăng ký muộn không được vượt quá thời gian kết thúc điểm danh",
                        HttpStatus.BAD_REQUEST),
        MEETING_PARTICIPANT_ALREADY_EXISTS(1229, "Người tham gia đã tồn tại trong cuộc họp", HttpStatus.CONFLICT),
        MEETING_PARTICIPANT_NOT_FOUND(1230, "Không tìm thấy người tham gia", HttpStatus.NOT_FOUND),
        MEETING_PARTICIPANT_NOT_EDITABLE(1231, "Không thể thay đổi người tham gia trong trạng thái cuộc họp hiện tại",
                        HttpStatus.BAD_REQUEST),
        MEETING_PARTICIPANT_MANAGEMENT_FORBIDDEN(1232, "Bạn không có quyền quản lý người tham gia cuộc họp này",
                        HttpStatus.FORBIDDEN),
        MEETING_CHAIR_REQUIRED(1233, "Cuộc họp phải có ít nhất một chủ tọa", HttpStatus.BAD_REQUEST),
        MEETING_SECRETARY_REQUIRED(1234, "Cuộc họp phải có ít nhất một thư ký", HttpStatus.BAD_REQUEST),
        PARTICIPANT_STATUS_INCONSISTENT(1235, "Trạng thái thư mời và trạng thái tham dự không đồng nhất",
                        HttpStatus.BAD_REQUEST),
        PARTICIPANT_ROLE_REQUIRED(1236, "Vui lòng chọn vai trò người tham gia", HttpStatus.BAD_REQUEST),
        INVITE_STATUS_REQUIRED(1237, "Vui lòng chọn trạng thái thư mời", HttpStatus.BAD_REQUEST),
        ATTENDANCE_STATUS_REQUIRED(1238, "Vui lòng chọn trạng thái tham dự", HttpStatus.BAD_REQUEST),
        USER_ID_REQUIRED(1239, "Vui lòng chọn người dùng", HttpStatus.BAD_REQUEST),
        // POSITION
        POSITION_NAME_REQUIRED(1240, "Vui lòng nhập tên chức vụ", HttpStatus.BAD_REQUEST),
        POSITION_CODE_REQUIRED(1241, "Vui lòng nhập mã chức vụ", HttpStatus.BAD_REQUEST),
        POSITION_NOT_EXIST(1242, "Chức vụ không tồn tại", HttpStatus.NOT_FOUND),
        POSITION_EXISTED(1243, "Chức vụ đã tồn tại", HttpStatus.CONFLICT),
        POSITION_IN_USE(1247, "Chức vụ đang được gán cho người dùng, không thể xóa", HttpStatus.CONFLICT),
        POSITION_ID_REQUIRED(1244, "Vui lòng chọn chức vụ", HttpStatus.BAD_REQUEST),
        POSITION_DEPARTMENT_MISMATCH(1245, "Chức vụ không thuộc phòng ban này", HttpStatus.BAD_REQUEST),
        ROLE_ID_REQUIRED(1246, "Vui lòng chọn vai trò", HttpStatus.BAD_REQUEST),
        MEETING_INVALID_RSVP_DEADLINE(1248, "Thời hạn xác nhận tham gia phải trước thời gian bắt đầu",
                        HttpStatus.BAD_REQUEST),
        MEETING_RSVP_DEADLINE_EXPIRED(1249, "Đã hết thời hạn xác nhận tham gia cuộc họp", HttpStatus.BAD_REQUEST),
        EMAIL_SEND_FAILED(1250, "Gửi email thất bại", HttpStatus.BAD_REQUEST),
        // ROLE
        ROLE_NOT_EXIST(1301, "Vai trò không tồn tại", HttpStatus.NOT_FOUND),
        ROLE_EXISTED(1303, "Vai trò đã tồn tại", HttpStatus.CONFLICT),
        ROLE_IN_USE(1304, "Vai trò đang được gán cho người dùng, không thể xóa", HttpStatus.CONFLICT),
        SYSTEM_ROLE_PROTECTED(1305, "Không thể đổi tên hoặc xóa vai trò hệ thống", HttpStatus.FORBIDDEN),
        SYSTEM_PERMISSION_PROTECTED(1306, "Không thể sửa mã code hoặc xóa quyền cốt lõi của hệ thống",
                        HttpStatus.FORBIDDEN),
        // PERMISSION
        PERMISSION_NOT_EXIST(1401, "Quyền không tồn tại", HttpStatus.NOT_FOUND),
        PERMISSION_EXISTED(1402, "Quyền đã tồn tại", HttpStatus.CONFLICT),
        // SCOPE
        SCOPE_NOT_FOUND(1403, "Không tìm thấy phạm vi (scope)", HttpStatus.NOT_FOUND),
        SCOPE_INVALID(1404, "Cấu hình phạm vi không hợp lệ", HttpStatus.BAD_REQUEST),
        // ROLE ASSIGNMENT
        ROLE_ASSIGNMENT_ALREADY_EXISTS(1405, "Vai trò đã được gán cho người dùng này", HttpStatus.CONFLICT),
        ROLE_ASSIGNMENT_NOT_FOUND(1406, "Không tìm thấy phân công vai trò", HttpStatus.NOT_FOUND),
        ROLE_ASSIGNMENT_FORBIDDEN(1407, "Bạn không có quyền quản lý phân công vai trò", HttpStatus.FORBIDDEN),
        PERMISSION_DENIED_IN_SCOPE(1408, "Không có quyền thực hiện trong phạm vi này", HttpStatus.FORBIDDEN),
        // PRODUCT
        PRODUCT_NOT_FOUND(1601, "Không tìm thấy sản phẩm", HttpStatus.NOT_FOUND),
        // SLOT
        SLOT_NOT_FOUND(1701, "Không tìm thấy khung giờ", HttpStatus.NOT_FOUND),
        // VALIDATE
        VALIDATION_FAILED(1801, "Xác thực dữ liệu thất bại", HttpStatus.BAD_REQUEST),
        // STOPOVER
        STOPOVER_NOT_FOUND(1901, "Không tìm thấy điểm dừng", HttpStatus.NOT_FOUND),
        // AGENDA & MOTION
        AGENDA_ITEM_NOT_FOUND(2001, "Nội dung cuộc họp không tồn tại", HttpStatus.NOT_FOUND),
        AGENDA_TIME_OUT_OF_MEETING(2002, "Thời gian của nội dung cuộc họp phải nằm trong khoảng thời gian cuộc họp",
                        HttpStatus.BAD_REQUEST),
        AGENDA_TIME_NOT_SEQUENTIAL(2003, "Thời gian của các nội dung cuộc họp phải tuần tự không chồng chéo",
                        HttpStatus.BAD_REQUEST),
        AGENDA_PREPARER_NOT_PARTICIPANT(2004, "Người chuẩn bị tài liệu phải là người tham gia cuộc họp",
                        HttpStatus.BAD_REQUEST),
        AGENDA_MODIFICATION_FORBIDDEN(2005,
                        "Chỉ có người tạo cuộc họp hoặc quản trị viên mới có quyền chỉnh sửa thông tin nội dung cuộc họp",
                        HttpStatus.FORBIDDEN),
        AGENDA_SUBMIT_DOCS_FORBIDDEN(2006, "Chỉ có người chuẩn bị tài liệu được gán mới có quyền upload tài liệu",
                        HttpStatus.FORBIDDEN),
        AGENDA_APPROVE_FORBIDDEN(2007, "Chỉ có người tạo cuộc họp mới có quyền phê duyệt tài liệu nội dung cuộc họp",
                        HttpStatus.FORBIDDEN),
        AGENDA_NOT_APPROVED(2008,
                        "Tất cả các nội dung cuộc họp phải được phê duyệt tài liệu trước khi trình duyệt cuộc họp",
                        HttpStatus.BAD_REQUEST),
        MOTION_NOT_FOUND(2009, "Vấn đề biểu quyết không tồn tại", HttpStatus.NOT_FOUND),
        MOTION_MODIFICATION_FORBIDDEN(2010, "Bạn không có quyền chỉnh sửa vấn đề biểu quyết này", HttpStatus.FORBIDDEN),
        MOTION_ALREADY_VOTED(2011, "Vấn đề biểu quyết đang trong phiên hoặc đã kết thúc, không thể chỉnh sửa hoặc xóa",
                        HttpStatus.BAD_REQUEST),
        VOTE_SESSION_CLOSED(2012, "Phiên biểu quyết đã kết thúc hoặc hết thời gian", HttpStatus.BAD_REQUEST),
        VOTE_ALREADY_CAST(2013, "Bạn đã thực hiện biểu quyết trước đó", HttpStatus.BAD_REQUEST),
        PARTICIPANT_NOT_PRESENT(2014, "Đại biểu chưa điểm danh, không thể thực hiện biểu quyết",
                        HttpStatus.BAD_REQUEST),
        VOTE_ROLE_NOT_ALLOWED(2015, "Chỉ đại biểu tham dự mới có quyền biểu quyết", HttpStatus.FORBIDDEN),
        // APPROVAL
        APPROVAL_REQUEST_NOT_FOUND(2051, "Yêu cầu phê duyệt không tồn tại", HttpStatus.NOT_FOUND),
        APPROVAL_STEP_NOT_FOUND(2052, "Bước phê duyệt không tồn tại", HttpStatus.NOT_FOUND),
        APPROVAL_REQUEST_ALREADY_PENDING(2053, "Tài nguyên đã có yêu cầu phê duyệt đang chờ xử lý",
                        HttpStatus.CONFLICT),
        APPROVAL_STATUS_TRANSITION_INVALID(2054, "Trạng thái phê duyệt không hợp lệ", HttpStatus.BAD_REQUEST),
        APPROVAL_RESOURCE_TYPE_UNSUPPORTED(2055, "Loại tài nguyên chưa hỗ trợ phê duyệt", HttpStatus.BAD_REQUEST),
        APPROVAL_RESOURCE_NOT_FOUND(2056, "Không tìm thấy tài nguyên cần phê duyệt", HttpStatus.NOT_FOUND),
        APPROVAL_CANCEL_FORBIDDEN(2057, "Chỉ người tạo yêu cầu mới được hủy", HttpStatus.FORBIDDEN),
        APPROVAL_REJECT_REASON_REQUIRED(2058, "Vui lòng nhập lý do từ chối", HttpStatus.BAD_REQUEST),
        // DOCUMENT
        DOCUMENT_NOT_FOUND(2101, "Tài liệu không tồn tại", HttpStatus.NOT_FOUND),
        DOCUMENT_ALREADY_ATTACHED(2102, "Tài liệu đã được gắn vào cuộc họp này", HttpStatus.CONFLICT),
        DOCUMENT_DETACH_FORBIDDEN(2103, "Bạn không có quyền gỡ tài liệu khỏi cuộc họp", HttpStatus.FORBIDDEN),
        DOCUMENT_DELETE_FORBIDDEN(2104, "Bạn không có quyền xóa tài liệu này", HttpStatus.FORBIDDEN),
        DOCUMENT_CANNOT_DELETE_NON_DRAFT(2105, "Chỉ có thể xóa tài liệu ở trạng thái DRAFT", HttpStatus.BAD_REQUEST),
        DOCUMENT_MEETING_NOT_FOUND(2106, "Tài liệu không thuộc cuộc họp này", HttpStatus.NOT_FOUND),
        FILE_UPLOAD_FAILED(2107, "Upload file thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
        FILE_TYPE_NOT_ALLOWED(2108, "Loại file không được hỗ trợ. Chỉ chấp nhận PDF, DOCX, XLSX, PPTX, PNG, JPG, ZIP",
                        HttpStatus.BAD_REQUEST),
        FILE_SIZE_EXCEEDED(2109, "Kích thước file vượt quá giới hạn 20MB", HttpStatus.BAD_REQUEST),
        
        // TEMPLATE
        TEMPLATE_NOT_FOUND(2201, "Mẫu thư mời không tồn tại", HttpStatus.NOT_FOUND),
        TEMPLATE_CODE_EXISTED(2202, "Mã mẫu thư mời đã tồn tại", HttpStatus.CONFLICT),
        TEMPLATE_RENDER_FAILED(2203, "Lỗi trong quá trình sinh file PDF từ mẫu", HttpStatus.INTERNAL_SERVER_ERROR),

        // GUEST VALIDATIONS
        MEETING_NOT_STARTED(1251, "Cuộc họp chưa đến thời điểm diễn ra", HttpStatus.BAD_REQUEST),
        MEETING_ALREADY_CLOSED(1252, "Cuộc họp đã kết thúc hoặc đã bị hủy", HttpStatus.BAD_REQUEST),
        MEETING_PARTICIPANT_ALREADY_CONFIRMED(1253, "Yêu cầu xác nhận không hợp lệ: Đồng chí đã xác nhận tham dự cuộc họp này trước đó.", HttpStatus.BAD_REQUEST),
        MEETING_LOCATION_CAPACITY_EXCEEDED(1254, "Số lượng người tham dự vượt quá sức chứa của phòng họp", HttpStatus.BAD_REQUEST),
        MEETING_POSTPONE_TIME_INVALID(1255, "Thời gian bắt đầu mới phải sau thời gian bắt đầu hiện tại của phiên họp", HttpStatus.BAD_REQUEST);

        int code;
        String message;
        HttpStatusCode statusCode;

        private ErrorCode(int code, String message, HttpStatusCode statusCode) {
                this.code = code;
                this.message = message;
                this.statusCode = statusCode;
        }

}
