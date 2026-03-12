package vn.acme.paperless_meeting.service.auth;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class SecurityUserDetailsService implements UserDetailsService{
    
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        
        User user = userRepository.findWithAuthoritiesByUsernameAndStatus(username, UserStatus.ACTIVE)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));



        return new UserPrincipal(user.getId(), user.getUsername(), user.getPasswordHash(), user.getStatus() == UserStatus.ACTIVE, user.getUserRoleScopeByUser().stream().map(ur -> ur.getRole().getRoleName()).toList());
                

    }

    
}
