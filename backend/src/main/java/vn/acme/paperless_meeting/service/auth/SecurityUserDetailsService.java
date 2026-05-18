package vn.acme.paperless_meeting.service.auth;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class SecurityUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // Load user kèm role + permissions (eager) để tránh N+1
        User user = userRepository.findWithAuthoritiesByUsernameAndStatus(username, UserStatus.ACTIVE)
                .orElseThrow(() -> new UsernameNotFoundException(ErrorCode.USER_NOT_EXISTED.getMessage()));

        // User có quan hệ N-1 với Role → chỉ có 1 role duy nhất
        List<String> authorities = new ArrayList<>();
        Role role = user.getRole();
        if (role != null) {
            // Thêm role code vào authorities (prefix ROLE_ cho Spring Security hasRole())
            authorities.add("ROLE_" + role.getRoleCode());

            // Thêm tất cả permission codes vào authorities (cho hasAuthority())
            if (role.getRolePermissionSet() != null) {
                for (var rp : role.getRolePermissionSet()) {
                    if (rp.getPermission() != null) {
                        authorities.add(rp.getPermission().getPermCode());
                    }
                }
            }
        }

        return new UserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getStatus() == UserStatus.ACTIVE,
                user.getIsFirstLogin() != null ? user.getIsFirstLogin() : false,
                authorities);
    }
}
