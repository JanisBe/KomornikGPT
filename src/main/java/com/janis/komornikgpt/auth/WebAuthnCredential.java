package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "webauthn_credentials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebAuthnCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private byte[] credentialId;

    @Column(nullable = false)
    private byte[] publicKeyCose;

    private long signatureCount;

    private boolean uvInitialized;

    private String transports;

    private boolean backupEligible;

    private boolean backupState;

    @Column(columnDefinition = "bytea")
    private byte[] attestationObject;

    @Column(columnDefinition = "bytea")
    private byte[] attestationClientDataJson;

    private String label;

    private Instant created;

    private Instant lastUsed;
}
