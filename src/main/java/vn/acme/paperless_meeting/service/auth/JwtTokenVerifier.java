package vn.acme.paperless_meeting.service.auth;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

@Component
// Lớp này sẽ chịu trách nhiệm giải mã và xác thực access token và refresh token, cũng như trích xuất thông tin từ token
public class JwtTokenVerifier {
     @Value("${app.security.jwt-secret-base64}")
    private String secretBase64;

    private SecretKey secretKey;

    @PostConstruct
    void init() {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretBase64));
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        return parse(token).getSubject();
    }

    public String extractType(String token) {
        return parse(token).get("type", String.class);
    }

    public String extractJti(String token) {
        return parse(token).getId();
    }

    public boolean isAccessToken(String token) {
        return "access".equals(extractType(token));
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(extractType(token));
    }
}
