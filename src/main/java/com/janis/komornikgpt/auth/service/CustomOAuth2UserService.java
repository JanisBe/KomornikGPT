package com.janis.komornikgpt.auth.service;

import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
@Slf4j
@Getter
@Setter
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    private static final String NAME_ATTRIBUTE = "name";
    private final UserRepository userRepository;
    private static final String EMAIL_KEY = "email";
    private boolean requiresPasswordSetup = false;
    private final GitHubEmailFetcher emailFetcher;
    private final OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();

    public CustomOAuth2UserService(UserRepository userRepository, GitHubEmailFetcher emailFetcher) {
        this.userRepository = userRepository;
        this.emailFetcher = emailFetcher;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = delegate.loadUser(userRequest);

        String primaryEmailAddress = extractPrimaryEmailAddress(
                oauth2User,
                userRequest.getAccessToken().getTokenValue());

        if (primaryEmailAddress == null) {
            log.error("Email not found from OAuth2 provider");
            throw new RuntimeException("Email not found from OAuth2 provider");
        }

        Map<String, Object> updatedAttributes = new HashMap<>(oauth2User.getAttributes());

        updatedAttributes.put(EMAIL_KEY, primaryEmailAddress);

        OAuth2User oAuth2User = new DefaultOAuth2User(
            oauth2User.getAuthorities(),
                updatedAttributes,
                NAME_ATTRIBUTE);
        String name = (String) updatedAttributes.get("name");
        processOAuth2User(primaryEmailAddress, name);
        return oAuth2User;
    }

    private String extractPrimaryEmailAddress(
            OAuth2User oauth2User,
            String token) {
        String primaryEmailAddress = oauth2User.getAttribute(EMAIL_KEY);

        if (!(primaryEmailAddress == null || primaryEmailAddress.isBlank())) {
            return primaryEmailAddress;
        }

        return emailFetcher.fetchPrimaryEmailAddress(token);
    }

    private void processOAuth2User(String email, String name) {

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            return;
        }

        User user = new User();
        user.setEmail(email);
        user.setName(name != null ? name : email.substring(0, email.indexOf('@')));
        user.setUsername(generateUsername(email));
        user.setPassword(UUID.randomUUID().toString());
        user.setEnabled(true);
        user.setRequiresPasswordSetup(true);
        userRepository.save(user);
    }

    private String generateUsername(String email) {
        return email.substring(0, email.indexOf('@')) + UUID.randomUUID().toString().substring(0, 8);
    }
}