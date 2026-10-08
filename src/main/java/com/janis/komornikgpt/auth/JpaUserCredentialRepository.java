package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.web.webauthn.api.*;
import org.springframework.security.web.webauthn.management.UserCredentialRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
@Slf4j
public class JpaUserCredentialRepository implements UserCredentialRepository {

    private final WebAuthnCredentialRepository credentialRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void save(@NonNull CredentialRecord credRecord) {
        log.info("Saving WebAuthn credential record with label: {}", credRecord.getLabel());
        byte[] credId = credRecord.getCredentialId().getBytes();
        WebAuthnCredential entity = credentialRepository.findByCredentialId(credId)
                .orElseGet(() -> {
                    byte[] userHandle = credRecord.getUserEntityUserId().getBytes();
                    String userIdStr = new String(userHandle, StandardCharsets.UTF_8);
                    Long userId = Long.parseLong(userIdStr);
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
                    return WebAuthnCredential.builder()
                            .user(user)
                            .credentialId(credId)
                            .created(Instant.now())
                            .build();
                });

        entity.setPublicKeyCose(credRecord.getPublicKey().getBytes());
        entity.setSignatureCount(credRecord.getSignatureCount());
        entity.setUvInitialized(credRecord.isUvInitialized());
        if (!credRecord.getTransports().isEmpty()) {
            entity.setTransports(credRecord.getTransports().stream()
                    .map(AuthenticatorTransport::getValue)
                    .collect(Collectors.joining(",")));
        }
        entity.setBackupEligible(credRecord.isBackupEligible());
        entity.setBackupState(credRecord.isBackupState());
        if (credRecord.getAttestationObject() != null) {
            entity.setAttestationObject(credRecord.getAttestationObject().getBytes());
        }
        if (credRecord.getAttestationClientDataJSON() != null) {
            entity.setAttestationClientDataJson(credRecord.getAttestationClientDataJSON().getBytes());
        }
        entity.setLabel(credRecord.getLabel());
        entity.setLastUsed(credRecord.getLastUsed());

        credentialRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public CredentialRecord findByCredentialId(Bytes credentialId) {
        return credentialRepository.findByCredentialId(credentialId.getBytes())
                .map(this::toRecord)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    @NonNull
    public List<CredentialRecord> findByUserId(Bytes userId) {
        String userIdStr = new String(userId.getBytes(), StandardCharsets.UTF_8);
        try {
            Long id = Long.parseLong(userIdStr);
            return userRepository.findById(id)
                    .map(credentialRepository::findByUser)
                    .orElse(List.of())
                    .stream()
                    .map(this::toRecord)
                    .toList();
        } catch (NumberFormatException _) {
            log.warn("Invalid user ID string in findByUserId: {}", userIdStr);
            return List.of();
        }
    }

    @Override
    @Transactional
    public void delete(Bytes credentialId) {
        credentialRepository.deleteByCredentialId(credentialId.getBytes());
    }

    private CredentialRecord toRecord(WebAuthnCredential entity) {
        Set<AuthenticatorTransport> transports = entity.getTransports() != null && !entity.getTransports().isBlank()
                ? Arrays.stream(entity.getTransports().split(","))
                .map(this::parseTransport)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet())
                : Set.of();

        byte[] userHandle = String.valueOf(entity.getUser().getId()).getBytes(StandardCharsets.UTF_8);

        return ImmutableCredentialRecord.builder()
                .credentialType(PublicKeyCredentialType.PUBLIC_KEY)
                .credentialId(new Bytes(entity.getCredentialId()))
                .userEntityUserId(new Bytes(userHandle))
                .publicKey(new ImmutablePublicKeyCose(entity.getPublicKeyCose()))
                .signatureCount(entity.getSignatureCount())
                .uvInitialized(entity.isUvInitialized())
                .transports(transports)
                .backupEligible(entity.isBackupEligible())
                .backupState(entity.isBackupState())
                .attestationObject(entity.getAttestationObject() != null ? new Bytes(entity.getAttestationObject()) : null)
                .attestationClientDataJSON(entity.getAttestationClientDataJson() != null ? new Bytes(entity.getAttestationClientDataJson()) : null)
                .label(entity.getLabel())
                .created(entity.getCreated())
                .lastUsed(entity.getLastUsed())
                .build();
    }

    private AuthenticatorTransport parseTransport(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        for (AuthenticatorTransport transport : AuthenticatorTransport.values()) {
            if (transport.getValue().equalsIgnoreCase(value.trim())) {
                return transport;
            }
        }
        return null;
    }
}
