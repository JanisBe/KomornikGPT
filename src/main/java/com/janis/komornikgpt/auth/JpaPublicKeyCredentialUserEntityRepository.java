package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.web.webauthn.api.Bytes;
import org.springframework.security.web.webauthn.api.ImmutablePublicKeyCredentialUserEntity;
import org.springframework.security.web.webauthn.api.PublicKeyCredentialUserEntity;
import org.springframework.security.web.webauthn.management.PublicKeyCredentialUserEntityRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

@Repository
@RequiredArgsConstructor
@Slf4j
public class JpaPublicKeyCredentialUserEntityRepository implements PublicKeyCredentialUserEntityRepository {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public PublicKeyCredentialUserEntity findById(Bytes id) {
        try {
            String idStr = new String(id.getBytes(), StandardCharsets.UTF_8);
            Long userId = Long.parseLong(idStr);
            return userRepository.findById(userId)
                    .map(this::toUserEntity)
                    .orElse(null);
        } catch (NumberFormatException e) {
            log.warn("Could not parse user ID from bytes: {}", e.getMessage());
            return null;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PublicKeyCredentialUserEntity findByUsername(@NonNull String username) {
        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .map(this::toUserEntity)
                .orElse(null);
    }

    @Override
    public void save(@NonNull PublicKeyCredentialUserEntity userEntity) {
        // User entity lifecycle is managed via UserService
    }

    @Override
    public void delete(@NonNull Bytes id) {
        // User entity lifecycle is managed via UserService
    }

    private PublicKeyCredentialUserEntity toUserEntity(User user) {
        byte[] userHandle = String.valueOf(user.getId()).getBytes(StandardCharsets.UTF_8);
        String displayName = (user.getName() != null && user.getSurname() != null)
                ? user.getName() + " " + user.getSurname()
                : user.getUsername();
        String name = (user.getEmail() != null && !user.getEmail().isBlank())
                ? user.getEmail()
                : user.getUsername();

        return ImmutablePublicKeyCredentialUserEntity.builder()
                .id(new Bytes(userHandle))
                .name(name)
                .displayName(displayName)
                .build();
    }
}
