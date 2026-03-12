package vn.acme.paperless_meeting.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.acme.paperless_meeting.entity.RefreshToken;


public interface  RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
        Optional<RefreshToken> findByJti(String jti);

}
