package com.janis.komornikgpt.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserRestController {
    private final UserService userService;

    @GetMapping("/me")
    public UserDto getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByUsername(userDetails.getUsername());
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
}