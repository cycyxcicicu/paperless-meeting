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
    // ROLE
    ROLE_NOT_EXIST(1301, "Role not existed", HttpStatus.NOT_FOUND),
    ROLE_EXISTED(1303, "Role existed", HttpStatus.CONFLICT),
    // PERMISSION
    PERMISSION_NOT_EXIST(1401, "Permission not existed", HttpStatus.NOT_FOUND),
    PERMISSION_EXISTED(1402, "Permission existed", HttpStatus.CONFLICT),
    // PRODUCT
    PRODUCT_NOT_FOUND(1601, "Product not found", HttpStatus.NOT_FOUND),
    // SLOT
    SLOT_NOT_FOUND(1701, "Slot not found", HttpStatus.NOT_FOUND),
    // STOPOVER
    STOPOVER_NOT_FOUND(1801, "StopOver not found", HttpStatus.NOT_FOUND);

    int code;
    String message;
    HttpStatusCode statusCode;

    private ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

}
