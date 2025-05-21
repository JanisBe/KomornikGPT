package com.janis.komornikgpt.mail;

import com.janis.komornikgpt.auth.JwtTokenProvider;
import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
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
public class VerificationRestController {
    private final VerificationTokenRepository tokenRepo;
    private final UserRepository userRepository;
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
        userRepository.save(user);
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
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setRequiresPasswordSetup(false);
        user.setPassword(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

}
