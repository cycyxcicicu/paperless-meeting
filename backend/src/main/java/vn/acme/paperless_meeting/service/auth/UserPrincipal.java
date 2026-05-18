package vn.acme.paperless_meeting.service.auth;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.Getter;

@Getter
public class UserPrincipal implements UserDetails {
    private final UUID id;
    private final String username;
    private final String password;
    private final boolean enabled;
    private final List<GrantedAuthority> authorities;

    private final boolean isFirstLogin;

    public UserPrincipal(UUID id, String username, String password, boolean enabled, boolean isFirstLogin, List<String> authoritiesStrings) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.enabled = enabled;
        this.isFirstLogin = isFirstLogin;
        this.authorities = authoritiesStrings == null ? List.of() : authoritiesStrings.stream()
                .map(a -> (GrantedAuthority) () -> a)
                .toList();
    }

  @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public boolean isAccountNonExpired() { return enabled; }

    @Override
    public boolean isAccountNonLocked() { return enabled; }

    @Override
    public boolean isCredentialsNonExpired() { return enabled; }

    @Override
    public boolean isEnabled() { return enabled; }

}
