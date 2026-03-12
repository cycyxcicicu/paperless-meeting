package vn.acme.paperless_meeting.service.auth;

import java.io.IOException;

import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.exceptions.ErrorCode;

@Component
// Lớp này sẽ định nghĩa các handler để trả về response có cấu trúc thống nhất khi xảy ra lỗi liên quan đến authentication và authorization
public class SecurityExceptionHandlers {
      private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) ->
                writeJson(response, ErrorCode.UNAUTHENTICATED);
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) ->
                writeJson(response, ErrorCode.UNAUTHOZIZED);
    }

    private void writeJson(HttpServletResponse response, ErrorCode errorCode) throws IOException {
        response.setStatus(errorCode.getStatusCode().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");

        ApiResponse<Object> apiResponse = ApiResponse.error(errorCode.getCode(), errorCode.getMessage());
        objectMapper.writeValue(response.getWriter(), apiResponse);
    }
}
