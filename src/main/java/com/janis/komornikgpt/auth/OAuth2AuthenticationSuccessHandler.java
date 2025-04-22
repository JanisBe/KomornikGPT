package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        if (email == null) {
            throw new RuntimeException("Email not found from OAuth2 provider");
        }

        User user = processOAuth2User(email, name, oauthToken.getAuthorizedClientRegistrationId());
        String token = jwtTokenProvider.generateToken(user);

        // Redirect to frontend with token
        String targetUrl = determineTargetUrl(request, response, authentication);
        targetUrl = appendToken(targetUrl, token);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private User processOAuth2User(String email, String name, String provider) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            return userOptional.get();
        }

        // Create new user
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setUsername(generateUsername(email));
        user.setPassword(UUID.randomUUID().toString()); // Random password for OAuth2 users
        return userRepository.save(user);
    }

    private String generateUsername(String email) {
        return email.substring(0, email.indexOf('@')) + UUID.randomUUID().toString().substring(0, 8);
    }

    private String appendToken(String url, String token) {
        return url + (url.contains("?") ? "&" : "?") + "token=" + token;
    }
}