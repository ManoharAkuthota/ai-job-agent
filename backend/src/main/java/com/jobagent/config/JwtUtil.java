package com.jobagent.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    // Default 256-bit secret key for HMAC-SHA256
    private static final String DEFAULT_SECRET = "JobAgentAiSecureSuperSecretKey2026ManoharAutonomousCareerAgentForFullStack!";
    
    // 7 days token validity
    private static final long EXPIRATION_MS = 7L * 24 * 60 * 60 * 1000;

    private final SecretKey key;

    public JwtUtil(@Value("${jwt.secret:}") String secretProperty) {
        String secret = (secretProperty != null && secretProperty.length() >= 32) ? secretProperty : DEFAULT_SECRET;
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Long userId, String email, String fullName) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + EXPIRATION_MS);

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("name", fullName)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Object id = getClaims(token).get("userId");
        if (id instanceof Number) {
            return ((Number) id).longValue();
        }
        return null;
    }

    public String extractFullName(String token) {
        Object name = getClaims(token).get("name");
        return name != null ? name.toString() : null;
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = getClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
