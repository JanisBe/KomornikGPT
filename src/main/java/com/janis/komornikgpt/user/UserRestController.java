package com.janis.komornikgpt.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "Endpointy do profilu użytkownika i jego znajomych")
public class UserRestController {
    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Pobierz mój profil", description = "Zwraca pełne dane profilowe aktualnie zalogowanego użytkownika.")
    public UserDto getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication instanceof OAuth2AuthenticationToken) {
            OAuth2User oauth2User = ((OAuth2AuthenticationToken) authentication).getPrincipal();
            User user = new User();
            String email;
            if (oauth2User.getAttribute("email") != null) {
                email = oauth2User.getAttribute("email");
            } else {
                email = oauth2User.getAttribute("sub");
            }

            user.setEmail(email);
            user.setUsername(oauth2User.getAttribute("name"));
            return UserDto.fromUser(user);
        }
        User user = userService.getUserByUsername(authentication.getName());
        return UserDto.fromUser(user);
    }

    @GetMapping
    @Operation(summary = "Pobierz wszystkich użytkowników", description = "Zwraca wszystkich zarejestrowanych użytkowników.")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.findAll().stream()
                .map(UserDto::fromUser)
                .collect(Collectors.toList());
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
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Zarejestruj użytkownika", description = "Standardowa rejestracja z e-mail i hasłem.")
    public User registerUser(@RequestBody CreateUserRequest request) {
        return userService.registerUser(request);
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Zaktualizuj użytkownika po ID")
    public User updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
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
                .collect(Collectors.toList());
        return ResponseEntity.ok(friends);
    }
}