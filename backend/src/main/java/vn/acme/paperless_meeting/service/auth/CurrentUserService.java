package vn.acme.paperless_meeting.service.auth;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.UserRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CurrentUserService {
    UserRepository userRepository;

    public User getCurrentActiveUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null || auth.getName().isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        String username = auth.getName();
        return userRepository.findByUsernameAndStatus(username, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    /**
     * Trả về role (String) duy nhất của user hiện tại, ví dụ: "ROLE_SUPER_ADMIN".
     * Nếu chưa xác thực hoặc không có role sẽ ném AppException.
     */
    public String getCurrentUserRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null || auth.getName().isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        var authorities = auth.getAuthorities();
        if (authorities == null || authorities.isEmpty()) {
            throw new AppException(ErrorCode.ROLE_NOT_EXIST);
        }
        // Authorities chứa cả role + permissions → filter lấy đúng ROLE_
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXIST));
    }

    /**
     * Kiểm tra user hiện tại có role tương ứng (theo chuỗi) hay không.
     */
    public boolean hasRole(String role) {
        return getCurrentUserRole().equals(role);
    }

    /**
     * Kiểm tra user hiện tại có role tương ứng (theo enum RoleName) hay không.
     */
    public boolean hasRole(RoleName role) {
        if (role == null)
            return false;
        return hasRole(role.getAuthority());
    }

    /**
     * Kiểm tra user hiện tại có permission (authority) cụ thể hay không.
     */
    public boolean hasAuthority(String authority) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(authority));
    }
}
