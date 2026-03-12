package vn.acme.paperless_meeting.exceptions;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.service.util.ErrorLogger;


@ControllerAdvice
public class GlobalExceptionHandler {

//	@ExceptionHandler(value = Exception.class)
//	public ResponseEntity<ApiResponse> handleNotFound(RuntimeException ex) {
//		ApiResponse apiResponse = new ApiResponse();
//		apiResponse.setCode(BaseErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
//		apiResponse.setMessage(BaseErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());
//		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiResponse);
//	}
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

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse<?>> handleUnknowException(Exception ex) {
        BaseErrorCode BaseErrorCode = ErrorCode.BAD_REQUEST;

        return ResponseEntity.status(BaseErrorCode.getStatusCode())
                .body(ApiResponse.error(BaseErrorCode.getCode(), ex.getClass().getSimpleName() + ": " + ex.getMessage()));
    }
}
