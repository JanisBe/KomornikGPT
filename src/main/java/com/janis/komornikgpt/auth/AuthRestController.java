package com.janis.komornikgpt.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Auth", description = "Endpointy do logowania, wylogowywania i zarządzania tokenami")
public class AuthRestController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Zaloguj użytkownika", description = "Autoryzuje użytkownika i ustawia ciasteczka z JWT oraz Refresh Token.")
    public ResponseEntity<CurrentUserResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        CurrentUserResponse authResponse = authService.login(request, response);
        return ResponseEntity.ok(authResponse);
    }

    @GetMapping("/user")
    @Operation(summary = "Pobierz zalogowanego użytkownika", description = "Zwraca skrócone dane powiązane z aktualnym tokenem JWT.")
    public ResponseEntity<CurrentUserResponse> getCurrentUser() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }

    @PostMapping("/refresh")
    @Operation(summary = "Odśwież token JWT", description = "Na podstawie ważnego Refresh Tokena wydaje nowy JWT Access Token.")
    public ResponseEntity<MessageResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        return authService.refreshToken(request, response)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Refresh Token is invalid or empty!")));
    }

    @PostMapping("/logout")
    @Operation(summary = "Wyloguj użytkownika", description = "Usuwa tokeny z bazy oraz czyści ciasteczka przeglądarki.")
    public ResponseEntity<MessageResponse> logout(HttpServletResponse response) {
        return ResponseEntity.ok(authService.logout(response));
    }
}