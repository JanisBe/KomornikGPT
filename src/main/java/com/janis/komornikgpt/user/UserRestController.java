package com.janis.komornikgpt.user;

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
public class UserRestController {
    private final UserService userService;

    @GetMapping("/me")
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
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.findAll().stream()
                .map(UserDto::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/create-without-password")
    public ResponseEntity<UserDto> createUserWithoutPassword(
            @Valid @RequestBody CreateUserWithoutPasswordRequest request) {
        User user = userService.createUserWithoutPassword(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UserDto.fromUser(user));
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public User registerUser(@RequestBody CreateUserRequest request) {
        return userService.registerUser(request);
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PutMapping("/me")
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
    public ResponseEntity<Boolean> checkUsernameExists(@RequestParam String username) {
        return ResponseEntity.ok(userService.checkUsernameExists(username));
    }

    @GetMapping("/check/email")
    public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
        return ResponseEntity.ok(userService.checkEmailExists(email));
    }
}