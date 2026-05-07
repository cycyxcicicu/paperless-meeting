package vn.acme.paperless_meeting.exceptions;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppException extends RuntimeException {
	private static final long serialVersionUID = 1L;
	
	BaseErrorCode errorCode;

	public AppException(BaseErrorCode errorCode) {
		super(errorCode.getMessage());
		this.errorCode = errorCode;
	}
}
