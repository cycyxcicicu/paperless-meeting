package vn.acme.paperless_meeting.controller.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.auth.ChangePasswordRequest;
import vn.acme.paperless_meeting.dto.request.auth.LoginRequest;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.service.User.UserService;
import vn.acme.paperless_meeting.service.auth.AuthService;
import vn.acme.paperless_meeting.service.util.CookieUtil;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
   
    @Value("${app.security.refresh-token-cookie-name}")
    private String refreshTokenCookieName;

    @PostMapping("/login")
    public ApiResponse<Void> login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        authService.login(request, httpRequest, response);

        return ApiResponse.<Void>builder()
                .success(true)
                .message("Đăng nhập thành công")
                .build();
    }

    @PostMapping("/refresh")
    public ApiResponse<Void> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = CookieUtil.getCookieValue(request, refreshTokenCookieName);
        authService.refresh(refreshToken, request, response);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Làm mới token thành công")
                .build();
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = CookieUtil.getCookieValue(request, refreshTokenCookieName);
        authService.logout(refreshToken, response);

        return ApiResponse.<Void>builder()
                .success(true)
                .message("Đăng xuất thành công")
                .build();
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        return ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Lấy thông tin người dùng hiện tại thành công")
                .data(userService.getCurrentUserResponse())
                .build();
    }


    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authentication, request);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Đổi mật khẩu thành công")
                .build();
    }
}