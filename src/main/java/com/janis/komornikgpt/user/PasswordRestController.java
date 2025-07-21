package com.janis.komornikgpt.user;

import com.janis.komornikgpt.auth.JwtTokenProvider;
import com.janis.komornikgpt.mail.ForgotPasswordRequest;
import com.janis.komornikgpt.mail.SetPasswordRequest;
import com.janis.komornikgpt.mail.VerificationToken;
import com.janis.komornikgpt.mail.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/pwd/")
@RequiredArgsConstructor
public class PasswordRestController {
    private final VerificationTokenRepository tokenRepo;
    private final UserService userService;
    private final JwtTokenProvider jwtService;
    private final PasswordEncoder passwordEncoder;
    private final Environment env;

    @GetMapping("/confirm-email")
    public ResponseEntity<Void> confirm(@RequestParam String token) {
        VerificationToken vt = tokenRepo.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Token not found"));

        if (vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        User user = vt.getUser();
        user.setEnabled(true);
        userService.saveUser(user);
        tokenRepo.delete(vt);

        String email = user.getEmail();
        String url = env.getProperty("frontend.url") + "/login?email=" + email;
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @PostMapping("/set-password")
    public ResponseEntity<Void> setPassword(@RequestBody SetPasswordRequest request, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userService.getUserByUsername(authentication.getName());
        user.setRequiresPasswordSetup(false);
        user.setPassword(passwordEncoder.encode(request.password()));
        userService.saveUser(user);

        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(env.getProperty("frontend.url"))).build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        boolean emailSent = userService.handleForgotPasswordRequest(request.email());

        if (!emailSent) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestParam String token,
            @RequestBody SetPasswordRequest request
    ) {
        VerificationToken vt = getVerificationToken(token);

        if (vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token expired");
        }

        User user = vt.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        userService.saveUser(user);
        tokenRepo.delete(vt);

        return ResponseEntity.ok("Password has been reset successfully");
    }

    @PostMapping("/set-password-with-token")
    public ResponseEntity<String> setPasswordWithToken(
            @RequestParam String token,
            @RequestBody SetPasswordRequest request
    ) {
        VerificationToken vt = getVerificationToken(token);

        if (vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token expired");
        }

        User user = vt.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEnabled(true);
        userService.saveUser(user);
        tokenRepo.delete(vt);

        return ResponseEntity.ok("Password has been set successfully");
    }

    private VerificationToken getVerificationToken(String token) {
        return tokenRepo.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Token not found"));
    }

}
