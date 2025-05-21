package com.janis.komornikgpt.mail;

import com.janis.komornikgpt.auth.JwtTokenProvider;
import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/")
@RequiredArgsConstructor
public class PasswordRestController {
    private final VerificationTokenRepository tokenRepo;
    private final UserService userService;
    private final JwtTokenProvider jwtService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/confirm")
    public ResponseEntity<String> confirm(@RequestParam String token) {
        VerificationToken vt = tokenRepo.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token wygasł");
        }

        User user = vt.getUser();
        user.setEnabled(true);
        userService.saveUser(user);
        tokenRepo.delete(vt);

        return ResponseEntity.ok("Konto aktywowane");
    }

    @PostMapping("/set-password")
    public ResponseEntity<Void> setPassword(
            @RequestBody SetPasswordRequest request,
            HttpServletRequest httpRequest
    ) {
        String token = jwtService.extractTokenFromCookies(httpRequest);
        if (token == null || !jwtService.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = jwtService.extractUsername(token);
        User user = userService.findByEmail(email);
        user.setRequiresPasswordSetup(false);
        user.setPassword(passwordEncoder.encode(request.password()));
        userService.saveUser(user);

        return ResponseEntity.ok().build();
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
        VerificationToken vt = tokenRepo.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Token not found"));

        if (vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token expired");
        }

        User user = vt.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        userService.saveUser(user);
        tokenRepo.delete(vt);

        return ResponseEntity.ok("Password has been reset successfully");
    }

}
