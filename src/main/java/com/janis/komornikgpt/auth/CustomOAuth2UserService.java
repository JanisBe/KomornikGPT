package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.user.Role;
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

import java.util.*;

@Component
@Slf4j
@Getter
@Setter
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    private static final String NAME_ATTRIBUTE = "name";
    private static final String SURNAME_ATTRIBUTE = "surname";
    private static final String EMAIL_KEY = "email";
    private final UserRepository userRepository;
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
        String firstName;
        String lastName;
        Map<String, Object> attributes = new HashMap<>(oauth2User.getAttributes());
        switch (userRequest.getClientRegistration().getRegistrationId().toLowerCase()) {
            case "google" -> {
                firstName = (String) attributes.get("given_name");
                lastName = (String) attributes.get("family_name");
            }
            case "facebook" -> {
                String fbName = (String) attributes.get("name");
                if (fbName != null && fbName.contains(" ")) {
                    String[] fbParts = fbName.trim().split(" ");
                    lastName = fbParts[fbParts.length - 1];
                    firstName = String.join(" ", Arrays.copyOf(fbParts, fbParts.length - 1));
                } else {
                    firstName = fbName;
                    lastName = "";
                }
            }
            case "github" -> {
                String fullName = (String) attributes.get("name");
                if (fullName != null && fullName.contains(" ")) {
                    String[] parts = fullName.split(" ", 2);
                    firstName = parts[0];
                    lastName = parts[1];
                } else {
                    firstName = fullName;
                    lastName = "";
                }
            }
            default -> {
                firstName = "Unknown";
                lastName = "User";
            }
        }
        attributes.put(EMAIL_KEY, primaryEmailAddress);
        attributes.put(NAME_ATTRIBUTE, firstName);
        attributes.put(SURNAME_ATTRIBUTE, lastName);
        OAuth2User oAuth2User = new DefaultOAuth2User(
            oauth2User.getAuthorities(),
                attributes,
                NAME_ATTRIBUTE);
        processOAuth2User(attributes);
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

    private void processOAuth2User(Map<String, Object> attributes) {
        String email = (String) attributes.get(EMAIL_KEY);
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            return;
        }
        User user = new User();
        if (attributes.containsKey(NAME_ATTRIBUTE)) {
            user.setName((String) attributes.get(NAME_ATTRIBUTE));
        }
        user.setSurname((String) attributes.get(SURNAME_ATTRIBUTE));
        user.setEmail(email);

        user.setUsername(generateUsername(email));
        user.setPassword(UUID.randomUUID().toString());
        user.setEnabled(true);
        user.setRequiresPasswordSetup(true);
        user.setRole(Role.USER);
        userRepository.save(user);
    }

    private String generateUsername(String email) {
        return email.substring(0, email.indexOf('@')) + UUID.randomUUID().toString().substring(0, 8);
    }
}