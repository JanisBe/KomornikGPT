-- V2__Add_Webauthn_Credentials.sql

CREATE TABLE IF NOT EXISTS webauthn_credentials
(
    id BIGSERIAL PRIMARY KEY,
    user_id         BIGINT  NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    credential_id BYTEA NOT NULL UNIQUE,
    public_key_cose BYTEA NOT NULL,
    signature_count BIGINT  NOT NULL,
    uv_initialized  BOOLEAN NOT NULL,
    backup_eligible BOOLEAN NOT NULL,
    backup_state    BOOLEAN NOT NULL,
    transports      VARCHAR(255),
    label           VARCHAR(255),
    created         TIMESTAMP WITH TIME ZONE,
    last_used       TIMESTAMP WITH TIME ZONE,
    attestation_object BYTEA,
    attestation_client_data_json BYTEA
);
