package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.exception.UserNotFoundException;
import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthRestController {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;

    @Value("${jwt.cookie.name}")
    private String cookieName;

    @Value("${jwt.refresh.cookie.name}")
    private String refreshCookieName;

    @Value("${jwt.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${jwt.cookie.expiration}") // Default 15 mins
    private int cookieExpiration;

    @Value("${jwt.refresh.expirationMs}") // Default 7 days
    private Long refreshTokenDurationMs;


    @Value("${jwt.cookie.domain:}")
    private String cookieDomain;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        return loginInternal(authentication, response);
    }

    public ResponseEntity<?> loginInternal(Authentication authentication, HttpServletResponse response) {

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String username = authentication.getName();
        User user = userService.getUserByUsername(username);
        String jwt = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        response.addCookie(createJwtCookie(jwt));
        response.addCookie(createRefreshCookie(refreshToken.getToken()));

        return getMapResponseEntity(user);
    }

    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }

        String identifier = authentication.getName();
        User user = findUserByIdentifier(identifier);

        return getMapResponseEntity(user);
    }

    private User findUserByIdentifier(String identifier) {
        try {
            return userService.getUserByEmail(identifier);
        } catch (UserNotFoundException e) {
            return userService.getUserByUsername(identifier);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenString = jwtTokenProvider.extractRefreshTokenFromCookies(request);

        if (refreshTokenString != null && !refreshTokenString.isEmpty()) {
            return refreshTokenService.findByToken(refreshTokenString)
                    .map(refreshTokenService::verifyExpiration)
                    .map(RefreshToken::getUser)
                    .map(user -> {
                        String token = jwtTokenProvider.generateToken(user);
                        response.addCookie(createJwtCookie(token));
                        return ResponseEntity.ok(Map.of("message", "Token refreshed successfully"));
                    })
                    .orElseGet(() -> ResponseEntity.status(403).body(Map.of("error", "Refresh token is not in database!")));
        }

        return ResponseEntity.status(403).body(Map.of("error", "Refresh Token is empty!"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && !"anonymousUser".equals(authentication.getPrincipal())) {
            String identifier = authentication.getName();
            User user = findUserByIdentifier(identifier);
            if (user != null) {
                refreshTokenService.deleteByUserId(user.getId());
            }
        }

        // Clear JWT, Refresh, and session cookies
        response.addCookie(createClearCookie(cookieName));
        response.addCookie(createClearCookie(refreshCookieName));
        response.addCookie(createClearCookie("JSESSIONID"));

        // Clear security context
        SecurityContextHolder.clearContext();

        log.info("User logged out successfully");
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private Cookie createJwtCookie(String value) {
        return CookieUtils.createCookie(cookieName, value, cookieExpiration, cookieSecure, cookieDomain, "Lax", cookieSecure);
    }

    private Cookie createRefreshCookie(String value) {
        int maxAgeInSeconds = (int) (refreshTokenDurationMs / 1000);
        return CookieUtils.createCookie(refreshCookieName, value, maxAgeInSeconds, cookieSecure, cookieDomain, "Lax", cookieSecure);
    }

    private Cookie createClearCookie(String name) {
        return CookieUtils.createCookie(name, "", 0, cookieSecure, cookieDomain, "Lax", cookieSecure);
    }

    private static ResponseEntity<Map<String, Object>> getMapResponseEntity(User user) {
        Map<String, Object> userDetails = new HashMap<>();
        userDetails.put("authenticated", true);
        userDetails.put("name", user.getName());
        userDetails.put("email", user.getEmail());
        userDetails.put("username", user.getUsername());
        userDetails.put("role", user.getRole());
        userDetails.put("id", user.getId());
        return ResponseEntity.ok(userDetails);
    }
}