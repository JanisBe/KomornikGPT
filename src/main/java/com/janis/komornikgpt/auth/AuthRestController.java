package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.exception.UserNotFoundException;
import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Auth", description = "Endpointy do logowania, wylogowywania i zarządzania tokenami")
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

    private static ResponseEntity<CurrentUserResponse> getMapResponseEntity(User user) {
        return ResponseEntity.ok(new CurrentUserResponse(
                true,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getUsername(),
                user.getRole()
        ));
    }

    @PostMapping("/login")
    @Operation(summary = "Zaloguj użytkownika", description = "Autoryzuje użytkownika i ustawia ciasteczka z JWT oraz Refresh Token.")
    public ResponseEntity<CurrentUserResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        return loginInternal(authentication, response);
    }

    public ResponseEntity<CurrentUserResponse> loginInternal(Authentication authentication, HttpServletResponse response) {

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String username = authentication.getName();
        User user = userService.getUserByUsername(username);
        String jwt = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        response.addCookie(createJwtCookie(jwt));
        response.addCookie(createRefreshCookie(refreshToken.getToken()));

        return getMapResponseEntity(user);
    }

    private User findUserByIdentifier(String identifier) {
        try {
            return userService.getUserByEmail(identifier);
        } catch (UserNotFoundException e) {
            return userService.getUserByUsername(identifier);
        }
    }

    @GetMapping("/user")
    @Operation(summary = "Pobierz zalogowanego użytkownika", description = "Zwraca skrócone dane powiązane z aktualnym tokenem JWT.")
    public ResponseEntity<CurrentUserResponse> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.ok(CurrentUserResponse.unauthenticated());
        }

        String identifier = authentication.getName();
        User user = findUserByIdentifier(identifier);

        return getMapResponseEntity(user);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Odśwież token JWT", description = "Na podstawie ważnego Refresh Tokena wydaje nowy JWT Access Token.")
    public ResponseEntity<MessageResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenString = jwtTokenProvider.extractRefreshTokenFromCookies(request);

        if (refreshTokenString != null && !refreshTokenString.isEmpty()) {
            return refreshTokenService.findByToken(refreshTokenString)
                    .map(refreshTokenService::verifyExpiration)
                    .map(RefreshToken::getUser)
                    .map(user -> {
                        String token = jwtTokenProvider.generateToken(user);
                        response.addCookie(createJwtCookie(token));
                        return ResponseEntity.ok(new MessageResponse("Token refreshed successfully"));
                    })
                    .orElseGet(() -> ResponseEntity.status(403).body(new MessageResponse("Refresh token is not in database!")));
        }

        return ResponseEntity.status(403).body(new MessageResponse("Refresh Token is empty!"));
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

    @PostMapping("/logout")
    @Operation(summary = "Wyloguj użytkownika", description = "Usuwa tokeny z bazy oraz czyści ciasteczka przeglądarki.")
    public ResponseEntity<MessageResponse> logout(HttpServletResponse response) {
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
        return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
    }
}