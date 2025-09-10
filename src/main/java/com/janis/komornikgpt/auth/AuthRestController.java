package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.exception.UserNotFoundException;
import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserService;
import jakarta.servlet.http.Cookie;
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

import static org.apache.tomcat.util.descriptor.web.Constants.COOKIE_PARTITIONED_ATTR;
import static org.apache.tomcat.util.descriptor.web.Constants.COOKIE_SAME_SITE_ATTR;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthRestController {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @Value("${jwt.cookie.name:JWT_TOKEN}")
    private String cookieName;

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

        Cookie cookie = new Cookie(cookieName, jwt);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setAttribute(COOKIE_PARTITIONED_ATTR, "true");
        cookie.setAttribute(COOKIE_SAME_SITE_ATTR, "None");
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60);
        response.addCookie(cookie);


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