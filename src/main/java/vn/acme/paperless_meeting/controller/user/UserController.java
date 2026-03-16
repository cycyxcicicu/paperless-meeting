package vn.acme.paperless_meeting.controller.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.user.UserCreateRequest;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.service.User.UserService;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserCreateRequest req) throws Exception {
        userService.register(req);
        return ResponseEntity.ok().body(ApiResponse.success("REGISTER SUCCESS!"));
    }

    @GetMapping("/user")
    public ApiResponse<User> getMethodName() {
        return ApiResponse.<User>builder()
                .success(true)
                .message("Lấy thông tin người dùng thành công")
                .data(userService.getUserByUsername())
                .build();
    }
}
