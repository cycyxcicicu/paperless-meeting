package vn.acme.paperless_meeting.exceptions;

import java.util.Map;

public class AppValidationException extends RuntimeException {
    private final Map<String, String> fieldErrors;

    public AppValidationException(Map<String, String> fieldErrors) {
        this.fieldErrors = fieldErrors;
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
