package vn.acme.paperless_meeting.controller;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.LoginRequest;
import vn.acme.paperless_meeting.service.auth.AuthService;
import vn.acme.paperless_meeting.service.util.CookieUtil;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
    public ApiResponse<Object> me(Authentication authentication) {
        return ApiResponse.builder()
                .success(true)
                .data(authentication.getPrincipal())
                .build();
    }

    // @PostMapping("/change-password")
    // public ResponseEntity<?> changePassword(Authentication authentication,
    //                                         @Valid @RequestBody ChangePasswordRequest request) {
    //     authService.changePassword(authentication, request);
    //     return ResponseEntity.ok(java.util.Map.of(
    //             "success", true,
    //             "message", "Đổi mật khẩu thành công"
    //     ));
    // }
}