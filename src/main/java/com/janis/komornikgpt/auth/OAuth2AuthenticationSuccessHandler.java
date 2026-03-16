package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.user.Role;
import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Value("${jwt.cookie.name}")
    private String cookieName;

    @Value("${jwt.refresh.cookie.name}")
    private String refreshCookieName;

    @Value("${jwt.cookie.expiration}") // Default 15 mins
    private int cookieExpiration;

    @Value("${jwt.refresh.expirationMs:604800000}") // Default 7 days
    private Long refreshTokenDurationMs;

    @Value("${jwt.cookie.secure:true}")
    private boolean cookieSecure;
    @Value("${frontend.url:http://localhost:8080}")
    private String frontendUrl;
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, @NonNull HttpServletResponse response,
                                        @NonNull Authentication authentication) throws IOException {
        log.info("OAuth2 authentication success handler started");
        log.info("User-Agent: {}", request.getHeader("User-Agent"));
        
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        if (email == null) {
            log.error("Email not found from OAuth2 provider. Available attributes: {}", attributes.keySet());
            throw new RuntimeException("Email not found from OAuth2 provider");
        }

        log.info("User authenticated: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    log.info("User not found, creating new account for: {}", email);
                    User newUser = User.builder()
                            .email(email)
                            .username(email)
                            .name((String) attributes.get("given_name"))
                            .surname((String) attributes.get("family_name"))
                            .role(Role.USER)
                            .enabled(true)
                            .requiresPasswordSetup(true)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .build();
                    return userRepository.save(newUser);
                });
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                user, null, user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authToken);
        log.info("OAuth2 authentication success handler completed authentication");

        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        String token = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        Cookie cookie = CookieUtils.createCookie(cookieName, token, cookieExpiration, cookieSecure, null, "Lax", cookieSecure);
        Cookie refreshCookie = CookieUtils.createCookie(refreshCookieName, refreshToken.getToken(), (int) (refreshTokenDurationMs / 1000), cookieSecure, null, "Lax", cookieSecure);

        log.info("Cookies created using CookieUtils: JWT secure={} | Refresh secure={}", cookie.getSecure(), refreshCookie.getSecure());
        
        response.addCookie(cookie);
        response.addCookie(refreshCookie);

        log.info("Cookies added: JWT secure={}, maxAge={} | Refresh secure={}, maxAge={}",
                cookie.getSecure(), cookie.getMaxAge(), refreshCookie.getSecure(), refreshCookie.getMaxAge());

        String url = this.frontendUrl + "/auth/callback";
        if (user.isRequiresPasswordSetup()) {
            String targetUrl = UriComponentsBuilder.fromUriString(url)
                    .queryParam("requiresPassword", user.isRequiresPasswordSetup())
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
            return;
        }
        getRedirectStrategy().sendRedirect(request, response, url);
        log.info("OAuth2 authentication success handler completed redirect");
    }
}