package com.janis.komornikgpt.auth;

import java.time.Instant;

public record WebAuthnCredentialDto(
        Long id,
        String credentialId,
        String label,
        Instant created,
        Instant lastUsed
) {
}
