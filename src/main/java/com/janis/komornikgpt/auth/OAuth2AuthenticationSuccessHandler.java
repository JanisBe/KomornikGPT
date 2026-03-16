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

import static org.apache.tomcat.util.descriptor.web.Constants.COOKIE_PARTITIONED_ATTR;
import static org.apache.tomcat.util.descriptor.web.Constants.COOKIE_SAME_SITE_ATTR;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.cookie.name:JWT_TOKEN}")
    private String cookieName;

    @Value("${jwt.cookie.expiration:86400}")
    private int cookieExpiration;

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
        String token = jwtTokenProvider.generateToken(user);

        Cookie cookie = new Cookie(cookieName, token);
        cookie.setHttpOnly(true);

        // For Chrome compatibility - SameSite=None requires Secure=true
        if (cookieSecure) {
            cookie.setAttribute(COOKIE_PARTITIONED_ATTR, "true");
            cookie.setAttribute(COOKIE_SAME_SITE_ATTR, "Lax");
            cookie.setSecure(true);
            log.info("Setting secure cookie with SameSite=None for production");
        } else {
            // For local development without HTTPS
            cookie.setAttribute(COOKIE_SAME_SITE_ATTR, "Lax");
            cookie.setSecure(false);
            log.info("Setting non-secure cookie with SameSite=Lax for local development");
        }
        
        cookie.setPath("/");
        cookie.setMaxAge(cookieExpiration);
        response.addCookie(cookie);

        log.info("Cookie added: name={}, secure={}, path={}, maxAge={}",
                cookieName, cookie.getSecure(), cookie.getPath(), cookie.getMaxAge());

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