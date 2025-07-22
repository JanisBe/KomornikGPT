package com.janis.komornikgpt.user;

import com.janis.komornikgpt.exception.*;
import com.janis.komornikgpt.mail.EmailService;
import com.janis.komornikgpt.mail.VerificationToken;
import com.janis.komornikgpt.mail.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;

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
        user.setEnabled(false);
        String token = UUID.randomUUID().toString();
        VerificationToken vt = new VerificationToken(token, user, LocalDateTime.now().plusHours(24));
        verificationTokenRepository.save(vt);

        emailService.sendVerificationEmail(user.getEmail(), token);

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

        user.setName(request.name());
        user.setSurname(request.surname());
        user.setEmail(request.email());
    }

    @Transactional
    public User updateUser(String username, UpdateUserRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

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

    @Transactional
    public User createUserWithoutPassword(CreateUserWithoutPasswordRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ResourceAlreadyExistsException("Username is already taken");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new ResourceAlreadyExistsException("Email is already taken");
        }

        User user = new User();
        user.setName(request.name());
        user.setSurname(request.surname());
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setRole(Role.USER);
        user.setRequiresPasswordSetup(true);
        String randomPassword = UUID.randomUUID().toString();
        user.setPassword(passwordEncoder.encode(randomPassword));

        String token = UUID.randomUUID().toString();
        VerificationToken vt = new VerificationToken(token, user, LocalDateTime.now().plusHours(48));
        verificationTokenRepository.save(vt);

        emailService.sendSetPasswordEmail(user.getEmail(), token);

        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public boolean handleForgotPasswordRequest(String email) {
        try {
            User user = getUserByEmail(email);
            if (verificationTokenRepository.existsByUser(user)) {
                throw new TokenAlreadyExistsException("Token already exists");
            }
            String token = UUID.randomUUID().toString();
            VerificationToken verificationToken = new VerificationToken(token, user, LocalDateTime.now().plusHours(24));
            verificationTokenRepository.save(verificationToken);

            emailService.sendPasswordResetEmail(user.getEmail(), token);

            return true;
        } catch (UserNotFoundException e) {
            return false;
        }
    }

    public boolean checkUsernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean checkEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }
}
