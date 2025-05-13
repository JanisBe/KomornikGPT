package com.janis.komornikgpt.user;

import com.janis.komornikgpt.exception.ResourceAlreadyExistsException;
import com.janis.komornikgpt.user.exception.UserAlreadyExistsException;
import com.janis.komornikgpt.user.exception.UserNotFoundException;
import com.janis.komornikgpt.user.exception.UsernameAlreadyExistsException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Transactional
    public User registerUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UsernameAlreadyExistsException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setSurname(request.getSurname());
        user.setRole(Role.USER);

        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public User updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        // Verify current password if trying to change password
        updateUserDetails(request, user);

        return userRepository.save(user);
    }

    private void updateUserDetails(UpdateUserRequest request, User user) {
        if (request.newPassword() != null && !request.newPassword().isEmpty()) {
            if (request.currentPassword() == null
                    || !passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(request.newPassword()));
        }

        // Update other fields
        user.setName(request.name());
        user.setSurname(request.surname());
        user.setEmail(request.email());
    }

    @Transactional
    public User updateUser(String username, UpdateUserRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify current password if trying to change password
        updateUserDetails(request, user);

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    public List<User> findAllByGroupId(Long groupId) {
        return userRepository.findAllByGroupId(groupId);
    }

    @Transactional
    public User createUserWithoutPassword(CreateUserWithoutPasswordRequest request) {
        // Check if username is already taken
        if (userRepository.existsByUsername(request.username())) {
            throw new ResourceAlreadyExistsException("Username is already taken");
        }

        // Check if email is already taken
        if (userRepository.existsByEmail(request.email())) {
            throw new ResourceAlreadyExistsException("Email is already taken");
        }

        // Create user with a random password
        User user = new User();
        user.setName(request.name());
        user.setSurname(request.surname());
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setRole(Role.USER);

        // Generate a random password that the user will need to change later
        String randomPassword = UUID.randomUUID().toString();
        user.setPassword(passwordEncoder.encode(randomPassword));

        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}