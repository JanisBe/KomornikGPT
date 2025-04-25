package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserService;
import com.janis.komornikgpt.user.exception.UserNotFoundException;
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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @Value("${jwt.cookie.name:JWT_TOKEN}")
    private String cookieName;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken((User) authentication);

        User user = userService.getUserByUsername(request.getUsername());

        return ResponseEntity.ok(new AuthResponse(jwt, user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        // Clear the JWT cookie
        Cookie cookie = new Cookie(cookieName, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0); // Delete the cookie
        response.addCookie(cookie);

        // Clear security context
        SecurityContextHolder.clearContext();

        return ResponseEntity.ok().build();
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

        Map<String, Object> userDetails = new HashMap<>();
        userDetails.put("authenticated", true);
        userDetails.put("name", user.getName());
        userDetails.put("email", user.getEmail());
        userDetails.put("username", user.getUsername());
        userDetails.put("role", user.getRole());

        return ResponseEntity.ok(userDetails);
    }

    private User findUserByIdentifier(String identifier) {
        // Try email first
        try {
            return userService.getUserByEmail(identifier);
        } catch (UserNotFoundException e) {
            // If not found by email, try username
            return userService.getUserByUsername(identifier);
        }
    }
}