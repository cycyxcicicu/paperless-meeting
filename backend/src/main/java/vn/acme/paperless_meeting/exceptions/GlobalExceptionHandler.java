package vn.acme.paperless_meeting.exceptions;

import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Optional;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.service.util.ErrorLogger;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // @ExceptionHandler(value = Exception.class)
    // public ResponseEntity<ApiResponse> handleNotFound(RuntimeException ex) {
    // ApiResponse apiResponse = new ApiResponse();
    // apiResponse.setCode(BaseErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
    // apiResponse.setMessage(BaseErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());
    // return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiResponse);
    // }
    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<ApiResponse<?>> handleAppException(AppException ex) {
        BaseErrorCode BaseErrorCode = ex.getErrorCode();

        return ResponseEntity.status(BaseErrorCode.getStatusCode())
                .body(ApiResponse.error(BaseErrorCode.getCode(), BaseErrorCode.getMessage()));
    }

    @ExceptionHandler(value = TokenExpiredException.class)
    public ResponseEntity<ApiResponse<?>> handleTokenExpiredException(AppException ex) {
        BaseErrorCode BaseErrorCode = ErrorCode.TOKEN_EXPIRED;

        return ResponseEntity.status(BaseErrorCode.getStatusCode())
                .body(ApiResponse.error(BaseErrorCode.getCode(), BaseErrorCode.getMessage()));
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDeniedException(AccessDeniedException ex) {
        BaseErrorCode BaseErrorCode = ErrorCode.UNAUTHOZIZED;

        return ResponseEntity.status(BaseErrorCode.getStatusCode())
                .body(ApiResponse.error(BaseErrorCode.getCode(), BaseErrorCode.getMessage()));
    }

    @ExceptionHandler(value = AuthenticationException.class)
    public ResponseEntity<ApiResponse<?>> handleAuthenticationException(AuthenticationException ex) {
        BaseErrorCode BaseErrorCode = ErrorCode.UNAUTHENTICATED;

        return ResponseEntity.status(BaseErrorCode.getStatusCode())
                .body(ApiResponse.error(BaseErrorCode.getCode(), "Sai username hoặc mật khẩu"));
    }
    @ExceptionHandler(AppValidationException.class)
    public ResponseEntity<?> handleAppValidationException(AppValidationException ex) {
        log.error("Exception: ", ex);
        ApiResponse<Map<String,String>> response = ApiResponse.error(
                ErrorCode.VALIDATION_FAILED.getCode(),
                ErrorCode.VALIDATION_FAILED.getMessage(),
                ex.getFieldErrors()
        );
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(MethodArgumentNotValidException ex) {
        String enumKey = Optional.ofNullable(ex.getFieldError())
                .map(FieldError::getDefaultMessage)
                .orElse("INVALID_KEY");
        BaseErrorCode BaseErrorCode = ErrorCode.INVALID_KEY;
        try {
            BaseErrorCode = ErrorCode.valueOf(enumKey);
        } catch (IllegalArgumentException e) {
            ErrorLogger.logError(e);
        }

        return ResponseEntity.status(BaseErrorCode.getStatusCode())
                .body(ApiResponse.error(BaseErrorCode.getCode(), BaseErrorCode.getMessage()));
    }

    @ExceptionHandler(value = HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<?>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Throwable cause = ex.getMostSpecificCause();
        String detail = Optional.ofNullable(cause).map(Throwable::getMessage).orElse(ex.getMessage());

        BaseErrorCode baseError = ErrorCode.BAD_REQUEST;
        if (detail != null && (detail.contains("LocalDateTime") || detail.contains("could not be parsed"))) {
            baseError = ErrorCode.INVALID_DATE_TIME_FORMAT;
        } else if (cause instanceof DateTimeParseException) {
            baseError = ErrorCode.INVALID_DATE_TIME_FORMAT;
        }

        return ResponseEntity.status(baseError.getStatusCode())
                .body(ApiResponse.error(baseError.getCode(), baseError.getMessage()));
    }

    @ExceptionHandler(value = MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<?>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex) {
        BaseErrorCode baseErrorCode = ErrorCode.FILE_SIZE_EXCEEDED;

        return ResponseEntity.status(baseErrorCode.getStatusCode())
                .body(ApiResponse.error(baseErrorCode.getCode(), baseErrorCode.getMessage()));
    }

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse<?>> handleUnknowException(Exception ex) {
        BaseErrorCode BaseErrorCode = ErrorCode.BAD_REQUEST;

        return ResponseEntity.status(BaseErrorCode.getStatusCode())
                .body(ApiResponse.error(BaseErrorCode.getCode(),
                        ex.getClass().getSimpleName() + ": " + ex.getMessage()));
    }
}
