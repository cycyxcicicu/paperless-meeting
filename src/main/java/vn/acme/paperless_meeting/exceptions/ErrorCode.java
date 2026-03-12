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
    // ROLE
    ROLE_NOT_EXIST(1301, "Role not existed", HttpStatus.NOT_FOUND),
    // PERMISSION
    PERMISSION_NOT_EXIST(1401, "Permission not existed", HttpStatus.NOT_FOUND),
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
