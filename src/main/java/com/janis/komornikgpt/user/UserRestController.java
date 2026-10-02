package com.janis.komornikgpt.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "Endpointy do profilu użytkownika i jego znajomych")
public class UserRestController {
    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Pobierz mój profil", description = "Zwraca pełne dane profilowe aktualnie zalogowanego użytkownika.")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (authentication instanceof OAuth2AuthenticationToken oauth2AuthenticationToken) {
            OAuth2User oauth2User = oauth2AuthenticationToken.getPrincipal();
            String email = oauth2User.getAttribute("email") != null ? oauth2User.getAttribute("email") : oauth2User.getAttribute("sub");
            User user = userService.getUserByEmail(email);
            return ResponseEntity.ok(UserDto.fromUser(user));
        }
        User user = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(UserDto.fromUser(user));
    }

    @GetMapping
    @Operation(summary = "Pobierz wszystkich użytkowników", description = "Zwraca wszystkich zarejestrowanych użytkowników.")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.findAll().stream()
                .map(UserDto::fromUser)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/create-without-password")
    @Operation(summary = "Utwórz użytkownika (bez hasła)", description = "Tworzy konto, generuje token i wymaga aktywacji/ustawienia hasła przez link.")
    public ResponseEntity<UserDto> createUserWithoutPassword(
            @Valid @RequestBody CreateUserWithoutPasswordRequest request) {
        UserCreationResult userResult = userService.createUserWithoutPassword(request);
        User user = userResult.user();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UserDto.fromUser(user));
    }

    @PostMapping("/register")
    @Operation(summary = "Zarejestruj użytkownika", description = "Standardowa rejestracja z e-mail i hasłem.")
    public ResponseEntity<UserDto> registerUser(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDto.fromUser(user));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Pobierz użytkownika po ID")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(UserDto.fromUser(user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Zaktualizuj użytkownika po ID")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication) {
        ResponseEntity<UserDto> UNAUTHORIZED = validateAuthentication(id, authentication);
        if (UNAUTHORIZED != null) return UNAUTHORIZED;
        User updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(UserDto.fromUser(updatedUser));
    }

    private @Nullable ResponseEntity<UserDto> validateAuthentication(Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User currentUser = userService.getUserByUsername(authentication.getName());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        if (!isAdmin && !currentUser.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return null;
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Usuń użytkownika po ID")
    public ResponseEntity<UserDto> deleteUser(@PathVariable Long id, Authentication authentication) {
        ResponseEntity<UserDto> UNAUTHORIZED = validateAuthentication(id, authentication);
        if (UNAUTHORIZED != null) return UNAUTHORIZED;
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me")
    @Operation(summary = "Zaktualizuj mój profil")
    public ResponseEntity<UserDto> updateCurrentUser(
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User updatedUser = userService.updateUser(authentication.getName(), request);
        return ResponseEntity.ok(UserDto.fromUser(updatedUser));
    }

    @GetMapping("/check/username")
    @Operation(summary = "Sprawdź nazwę użytkownika", description = "Weryfikuje czy dany username jest już zajęty podczas rejestracji.")
    public ResponseEntity<Boolean> checkUsernameExists(@RequestParam String username) {
        return ResponseEntity.ok(userService.checkUsernameExists(username));
    }

    @GetMapping("/check/email")
    @Operation(summary = "Sprawdź adres e-mail", description = "Weryfikuje czy podany e-mail jest już zarejestrowany.")
    public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
        return ResponseEntity.ok(userService.checkEmailExists(email));
    }

    @GetMapping("/{userId}/friends")
    @Operation(summary = "Pobierz znajomych", description = "Zwraca listę osób, ze wspólnymi grupami uzytkownika.")
    public ResponseEntity<List<UserDto>> getUserFriends(@PathVariable Long userId) {
        List<UserDto> friends = userService.findFriendsByUserId(userId).stream()
                .map(UserDto::fromUser)
                .toList();
        return ResponseEntity.ok(friends);
    }
}