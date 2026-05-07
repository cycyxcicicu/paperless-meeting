package vn.acme.paperless_meeting.exceptions;

import org.springframework.security.core.AuthenticationException;

public class TokenExpiredException extends AuthenticationException {
    private static final long serialVersionUID = 1L;

    public TokenExpiredException(String message) {
        super(message);
    }
}
