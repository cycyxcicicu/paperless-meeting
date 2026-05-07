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
        UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
        BAD_REQUEST(4000, "Bad request", HttpStatus.BAD_REQUEST),
        INVALID_DATE_TIME_FORMAT(4001, "Invalid date-time format", HttpStatus.BAD_REQUEST),
        // AUTH
        UNAUTHENTICATED(1001, "Unauthenticated", HttpStatus.UNAUTHORIZED),
        UNAUTHOZIZED(1003, "You not have permission", HttpStatus.FORBIDDEN),
        INVALID_KEY(1002, "Invalid key", HttpStatus.BAD_REQUEST),
        TOKEN_EXPIRED(1004, "Token expired", HttpStatus.UNAUTHORIZED),
        PASSWORD_REQUIRED(1005, "Password required", HttpStatus.BAD_REQUEST),
        USERNAME_REQUIRED(1006, "Username required", HttpStatus.BAD_REQUEST),
        USER_FULLNAME_REQUIRED(1007, "Full name required", HttpStatus.BAD_REQUEST),
        USER_EMAIL_REQUIRED(1008, "Email required", HttpStatus.BAD_REQUEST),
        USER_PHONE_REQUIRED(1009, "Phone required", HttpStatus.BAD_REQUEST),
        USER_STATUS_REQUIRED(1010, "User status required", HttpStatus.BAD_REQUEST),
        USER_EMAIL_INVALID(1011, "Invalid email format", HttpStatus.BAD_REQUEST),
        DEPARTMENT_NAME_REQUIRED(1012, "Department name required", HttpStatus.BAD_REQUEST),
        DEPARTMENT_ID_REQUIRED(1017, "Department id required", HttpStatus.BAD_REQUEST),
        LOCATION_NAME_REQUIRED(1013, "Location name required", HttpStatus.BAD_REQUEST),
        LOCATION_TYPE_REQUIRED(1014, "Location type required", HttpStatus.BAD_REQUEST),
        ROLE_NAME_REQUIRED(1015, "Role name required", HttpStatus.BAD_REQUEST),
        PERMISSION_CODE_REQUIRED(1016, "Permission code required", HttpStatus.BAD_REQUEST),

        // REGISTER
        OTP_NOT_FOUND(1501, "OTP not found or expired", HttpStatus.BAD_REQUEST),
        OTP_INVALID(1502, "OTP invalid", HttpStatus.BAD_REQUEST),
        ROLE_NOT_FOUND(1302, "Role USER not found", HttpStatus.INTERNAL_SERVER_ERROR),
        USER_INFO_EXISTED(1104, "Username, email or phone already existed", HttpStatus.CONFLICT),
        // VALIDATION
        NAME_INVALID(1201, "Name must be at least 3 characters", HttpStatus.BAD_REQUEST),
        PASSWORD_INVALID(1202, "Password must be at least 8 characters", HttpStatus.BAD_REQUEST),
        // USER
        USER_NOT_EXISTED(1101, "User not existed", HttpStatus.NOT_FOUND),
        USER_EXISTED(1102, "User existed", HttpStatus.CONFLICT),
        EMAIL_EXISTED(1103, "Email existed", HttpStatus.CONFLICT),
        PHONE_EXISTED(1104, "Phone existed", HttpStatus.CONFLICT),
        // DEPARTMENT
        DEPARTMENT_NOT_EXIST(1203, "Department not existed", HttpStatus.NOT_FOUND),
        DEPARTMENT_EXISTED(1204, "Department existed", HttpStatus.CONFLICT),
        // LOCATION
        LOCATION_NOT_EXIST(1205, "Location not existed", HttpStatus.NOT_FOUND),
        // MEETING
        MEETING_NOT_EXIST(1206, "Meeting not existed", HttpStatus.NOT_FOUND),
        MEETING_TITLE_REQUIRED(1207, "Meeting title required", HttpStatus.BAD_REQUEST),
        MEETING_TITLE_INVALID(1208, "Meeting title invalid", HttpStatus.BAD_REQUEST),
        MEETING_DESCRIPTION_INVALID(1209, "Meeting description invalid", HttpStatus.BAD_REQUEST),
        MEETING_START_TIME_REQUIRED(1210, "Meeting start time required", HttpStatus.BAD_REQUEST),
        MEETING_END_TIME_REQUIRED(1211, "Meeting end time required", HttpStatus.BAD_REQUEST),
        MEETING_LOCATION_REQUIRED(1212, "Meeting location required", HttpStatus.BAD_REQUEST),
        MEETING_STATUS_REQUIRED(1213, "Meeting status required", HttpStatus.BAD_REQUEST),
        MEETING_CANCEL_REASON_REQUIRED(1214, "Meeting cancel reason required", HttpStatus.BAD_REQUEST),
        MEETING_CANCEL_REASON_INVALID(1215, "Meeting cancel reason invalid", HttpStatus.BAD_REQUEST),
        MEETING_INVALID_TIME_RANGE(1216, "Meeting end time must be after start time", HttpStatus.BAD_REQUEST),
        MEETING_INVALID_CHECKIN_TIME_RANGE(1217, "Meeting checkin time range invalid", HttpStatus.BAD_REQUEST),
        MEETING_INVALID_LATE_AFTER_MINUTES(1218, "Meeting late after minutes invalid", HttpStatus.BAD_REQUEST),
        MEETING_STATUS_TRANSITION_INVALID(1219, "Meeting status transition invalid", HttpStatus.BAD_REQUEST),
        MEETING_ONLY_DRAFT_ALLOWED(1220, "This action is only allowed when meeting is DRAFT", HttpStatus.BAD_REQUEST),
        MEETING_ALREADY_CLOSED_OR_CANCELLED(1221, "Meeting is already CLOSED or CANCELLED", HttpStatus.BAD_REQUEST),
        MEETING_MUST_BE_SCHEDULED_BEFORE_30_MINUTES(1222, "Meeting must be scheduled at least 30 minutes before start",
                        HttpStatus.BAD_REQUEST),
        MEETING_LOCATION_OR_TIME_REQUIRED(1223, "Meeting location or time required", HttpStatus.BAD_REQUEST),
        MEETING_LOCATION_TIME_CONFLICT(1224, "Meeting location/time conflict with another meeting",
                        HttpStatus.BAD_REQUEST),
        MEETING_CANNOT_CANCEL_IN_CURRENT_STATUS(1225, "Meeting cannot be cancelled in current status",
                        HttpStatus.BAD_REQUEST),
        MEETING_CHECKIN_OPEN_TIME_INVALID(1226,
                        "Meeting checkin open time must be before start time and at most 30 minutes before",
                        HttpStatus.BAD_REQUEST),
        MEETING_CHECKIN_CLOSE_TIME_INVALID(1227,
                        "Meeting checkin close time must be after start time and at most 15 minutes after",
                        HttpStatus.BAD_REQUEST),
        MEETING_LATE_AFTER_MINUTES_EXCEEDS_CHECKIN_CLOSE(1228,
                        "Late registration deadline cannot exceed checkin close time",
                        HttpStatus.BAD_REQUEST),
        MEETING_PARTICIPANT_ALREADY_EXISTS(1229, "Meeting participant already exists", HttpStatus.CONFLICT),
        MEETING_PARTICIPANT_NOT_FOUND(1230, "Meeting participant not found", HttpStatus.NOT_FOUND),
        MEETING_PARTICIPANT_NOT_EDITABLE(1231, "Meeting participants cannot be modified in current meeting status",
                        HttpStatus.BAD_REQUEST),
        MEETING_PARTICIPANT_MANAGEMENT_FORBIDDEN(1232, "You cannot manage participants for this meeting",
                        HttpStatus.FORBIDDEN),
        MEETING_CHAIR_REQUIRED(1233, "At least one chair is required", HttpStatus.BAD_REQUEST),
        MEETING_SECRETARY_REQUIRED(1234, "At least one secretary is required", HttpStatus.BAD_REQUEST),
        PARTICIPANT_STATUS_INCONSISTENT(1235, "Participant invite status and attendance status are inconsistent",
                        HttpStatus.BAD_REQUEST),
        PARTICIPANT_ROLE_REQUIRED(1236, "Participant role required", HttpStatus.BAD_REQUEST),
        INVITE_STATUS_REQUIRED(1237, "Invite status required", HttpStatus.BAD_REQUEST),
        ATTENDANCE_STATUS_REQUIRED(1238, "Attendance status required", HttpStatus.BAD_REQUEST),
        USER_ID_REQUIRED(1239, "User id required", HttpStatus.BAD_REQUEST),
        // POSITION
        POSITION_NAME_REQUIRED(1240, "Position name required", HttpStatus.BAD_REQUEST),
        POSITION_CODE_REQUIRED(1241, "Position code required", HttpStatus.BAD_REQUEST),
        POSITION_NOT_EXIST(1242, "Position not existed", HttpStatus.NOT_FOUND),
        POSITION_EXISTED(1243, "Position existed", HttpStatus.CONFLICT),
        POSITION_ID_REQUIRED(1244, "Position id required", HttpStatus.BAD_REQUEST),
        POSITION_DEPARTMENT_MISMATCH(1245, "Position does not belong to department", HttpStatus.BAD_REQUEST),
        ROLE_ID_REQUIRED(1246, "Role id required", HttpStatus.BAD_REQUEST),
        // ROLE
        ROLE_NOT_EXIST(1301, "Role not existed", HttpStatus.NOT_FOUND),
        ROLE_EXISTED(1303, "Role existed", HttpStatus.CONFLICT),
        // PERMISSION
        PERMISSION_NOT_EXIST(1401, "Permission not existed", HttpStatus.NOT_FOUND),
        PERMISSION_EXISTED(1402, "Permission existed", HttpStatus.CONFLICT),
        // SCOPE
        SCOPE_NOT_FOUND(1403, "Scope not found", HttpStatus.NOT_FOUND),
        SCOPE_INVALID(1404, "Scope configuration invalid", HttpStatus.BAD_REQUEST),
        // ROLE ASSIGNMENT
        ROLE_ASSIGNMENT_ALREADY_EXISTS(1405, "Role assignment already exists", HttpStatus.CONFLICT),
        ROLE_ASSIGNMENT_NOT_FOUND(1406, "Role assignment not found", HttpStatus.NOT_FOUND),
        ROLE_ASSIGNMENT_FORBIDDEN(1407, "You cannot manage role assignments", HttpStatus.FORBIDDEN),
        PERMISSION_DENIED_IN_SCOPE(1408, "Permission denied in scope", HttpStatus.FORBIDDEN),
        // PRODUCT
        PRODUCT_NOT_FOUND(1601, "Product not found", HttpStatus.NOT_FOUND),
        // SLOT
        SLOT_NOT_FOUND(1701, "Slot not found", HttpStatus.NOT_FOUND),
        //VALIDATE
        VALIDATION_FAILED(1801, "Validation failed", HttpStatus.BAD_REQUEST),
        // STOPOVER
        STOPOVER_NOT_FOUND(1901, "StopOver not found", HttpStatus.NOT_FOUND);

        int code;
        String message;
        HttpStatusCode statusCode;

        private ErrorCode(int code, String message, HttpStatusCode statusCode) {
                this.code = code;
                this.message = message;
                this.statusCode = statusCode;
        }

}
