package vn.acme.paperless_meeting.exceptions;

import org.springframework.http.HttpStatusCode;

public interface BaseErrorCode {

    int getCode();

    String getMessage();

    HttpStatusCode getStatusCode();
}
