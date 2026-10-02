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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

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

    @Value("${jwt.cookie.expiration}")
    private int cookieExpiration;

    @Value("${jwt.refresh.expirationMs}")
    private Long refreshTokenDurationMs;

    @Value("${jwt.cookie.domain:}")
    private String cookieDomain;

    public CurrentUserResponse login(LoginRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        return loginWithAuthentication(authentication, response);
    }

    public CurrentUserResponse loginWithAuthentication(Authentication authentication, HttpServletResponse response) {
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String username = authentication.getName();
        User user = userService.getUserByUsername(username);
        String jwt = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        response.addCookie(createJwtCookie(jwt));
        response.addCookie(createRefreshCookie(refreshToken.getToken()));

        return new CurrentUserResponse(
                true,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getUsername(),
                user.getRole()
        );
    }

    public CurrentUserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return CurrentUserResponse.unauthenticated();
        }

        String identifier = authentication.getName();
        User user = findUserByIdentifier(identifier);

        return new CurrentUserResponse(
                true,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getUsername(),
                user.getRole()
        );
    }

    public Optional<MessageResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenString = jwtTokenProvider.extractRefreshTokenFromCookies(request);

        if (refreshTokenString != null && !refreshTokenString.isEmpty()) {
            return refreshTokenService.findByToken(refreshTokenString)
                    .map(refreshTokenService::verifyExpiration)
                    .map(RefreshToken::getUser)
                    .map(user -> {
                        String token = jwtTokenProvider.generateToken(user);
                        response.addCookie(createJwtCookie(token));
                        return new MessageResponse("Token refreshed successfully");
                    });
        }

        return Optional.empty();
    }

    public MessageResponse logout(HttpServletResponse response) {
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
        return new MessageResponse("Logged out successfully");
    }

    private User findUserByIdentifier(String identifier) {
        try {
            return userService.getUserByEmail(identifier);
        } catch (UserNotFoundException _) {
            return userService.getUserByUsername(identifier);
        }
    }

    public Cookie createJwtCookie(String value) {
        return CookieUtils.createCookie(cookieName, value, cookieExpiration, cookieSecure, cookieDomain, "Lax", cookieSecure);
    }

    public Cookie createRefreshCookie(String value) {
        int maxAgeInSeconds = (int) (refreshTokenDurationMs / 1000);
        return CookieUtils.createCookie(refreshCookieName, value, maxAgeInSeconds, cookieSecure, cookieDomain, "Lax", cookieSecure);
    }

    public Cookie createClearCookie(String name) {
        return CookieUtils.createCookie(name, "", 0, cookieSecure, cookieDomain, "Lax", cookieSecure);
    }
}
