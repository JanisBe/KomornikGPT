package com.janis.komornikgpt.user;

import com.janis.komornikgpt.auth.AuthRestController;
import com.janis.komornikgpt.exception.TokenMissingException;
import com.janis.komornikgpt.mail.ForgotPasswordRequest;
import com.janis.komornikgpt.mail.SetPasswordRequest;
import com.janis.komornikgpt.mail.VerificationToken;
import com.janis.komornikgpt.mail.VerificationTokenRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/pwd/")
@RequiredArgsConstructor
@Tag(name = "Hasła", description = "Endpointy do resetowania hasła i potwierdzania email")
public class PasswordRestController {
    private final VerificationTokenRepository tokenRepo;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final Environment env;
    private final AuthRestController authRestController;

    @GetMapping("/confirm-email")
    @Operation(summary = "Potwierdź adres e-mail", description = "Aktywuje konto użytkownika po kliknięciu linku przesłanego w e-mailu rejestracyjnym.")
    public ResponseEntity<?> confirm(@RequestParam String token, HttpServletResponse response) {
        VerificationToken vt = getVerificationToken(token);

        if (vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        User user = vt.getUser();
        user.setEnabled(true);
        userService.saveUser(user);
        tokenRepo.delete(vt);
        return loginUser(response, user);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Zapomniałem hasła", description = "Rozpoczyna procedurę resetowania hasła wysyłając e-mail z tokenem.")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        boolean emailSent = userService.handleForgotPasswordRequest(request.email());

        if (!emailSent) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Zmień hasło (zapomniane)", description = "Służy do ustawienia nowego hasła na podstawie tokena z e-maila w procesie 'forgot-password'.")
    public ResponseEntity<?> resetPassword(
            @RequestParam String token,
            @RequestBody SetPasswordRequest request,
            HttpServletResponse response
    ) {
        VerificationToken vt = getVerificationToken(token);

        if (vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token jest już nieważny");
        }

        User user = vt.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        userService.saveUser(user);
        tokenRepo.delete(vt);

        return loginUser(response, user);
    }

    @PostMapping("/set-password")
    @Operation(summary = "Ustaw hasło (zalogowany wpis z OAuth)", description = "Pozwala użytkownikowi zarejestrowanemu przez OAuth2 na ustawienie własnego hasła (np. dla przyszłych logowań lokalnych).")
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

    @PostMapping("/set-password-with-token")
    @Operation(summary = "Ustaw hasło z tokenem rejestrowania", description = "Procedura ustawienia hasła przy zaproszeniach (createUserWithoutPassword).")
    public ResponseEntity<?> setPasswordWithToken(
            @RequestParam String token,
            @RequestBody SetPasswordRequest request,
            HttpServletResponse response
    ) {
        VerificationToken vt = getVerificationToken(token);

        if (vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token jest już nieważny");
        }

        User user = vt.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEnabled(true);
        userService.saveUser(user);
        tokenRepo.delete(vt);

        return loginUser(response, user);
    }

    private VerificationToken getVerificationToken(String token) {
        return tokenRepo.findByToken(token)
                .orElseThrow(() -> new TokenMissingException("Nie znaleziono tokena"));
    }

    private ResponseEntity<?> loginUser(HttpServletResponse response, User user) {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                user,
                null,
                user.getAuthorities());

        return authRestController.loginInternal(authToken, response);
    }
}
