package vn.acme.paperless_meeting.service.auth;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

@Component
// Lớp này sẽ chịu trách nhiệm tạo access token và refresh token dựa trên thông tin cấu hình từ application.yaml
public class JwtTokenGenerator  {
    @Value("${app.security.jwt-secret-base64}")
    private String secretBase64;

    @Value("${app.security.issuer}")
    private String issuer;

    @Value("${app.security.access-token-expiration-seconds}")
    private long accessTokenExpirationSeconds;

    @Value("${app.security.refresh-token-expiration-seconds}")
    private long refreshTokenExpirationSeconds;

    private SecretKey secretKey;

    @PostConstruct
void init() {
    this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretBase64));
}

private String generateToken(String username, String type, long expirationSeconds) {
    Instant now = Instant.now();

    return Jwts.builder()
            .subject(username)
            .issuer(issuer)
            .id(UUID.randomUUID().toString())
            .claim("type", type)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(expirationSeconds)))
            .signWith(secretKey, Jwts.SIG.HS512) 
            .compact();
}

public String generateAccessToken(String username) {
    return generateToken(username, "access", accessTokenExpirationSeconds);
}

public String generateRefreshToken(String username) {
    return generateToken(username, "refresh", refreshTokenExpirationSeconds);
}

}
