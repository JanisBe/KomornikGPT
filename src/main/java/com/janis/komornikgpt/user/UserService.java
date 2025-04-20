package com.janis.komornikgpt.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .map(this::mapToUserDetails)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private UserDetails mapToUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities("ROLE_USER")
                .build();
    }

    @Transactional
    public User createUser(UserRegistrationDto registrationDto) {
        if (userRepository.existsByUsername(registrationDto.username())) {
            throw new UserExistsException("Username already exists");
        }

        if (userRepository.existsByEmail(registrationDto.email())) {
            throw new UserExistsException("Email already registered");
        }

        User newUser = new User();
        newUser.setUsername(registrationDto.username());
        newUser.setEmail(registrationDto.email());
        newUser.setPassword(passwordEncoder.encode(registrationDto.password()));

        return userRepository.save(newUser);
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
    }

    @Transactional
    public User updateUser(Long id, UserUpdateDto updateDto) {
        User existingUser = findById(id);

        if (!existingUser.getUsername().equals(updateDto.username()) && 
            userRepository.existsByUsername(updateDto.username())) {
            throw new UserExistsException("Username already exists");
        }

        if (!existingUser.getEmail().equals(updateDto.email()) && 
            userRepository.existsByEmail(updateDto.email())) {
            throw new UserExistsException("Email already registered");
        }

        existingUser.setUsername(updateDto.username());
        existingUser.setEmail(updateDto.email());
        
        if (updateDto.password() != null && !updateDto.password().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(updateDto.password()));
        }

        return userRepository.save(existingUser);
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
}