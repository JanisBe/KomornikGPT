-- V1__Initial_Schema.sql

CREATE TABLE users
(
    id                      BIGSERIAL PRIMARY KEY,
    username                VARCHAR(255) NOT NULL UNIQUE,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    password                VARCHAR(255) NOT NULL,
    name                    VARCHAR(255),
    surname                 VARCHAR(255),
    enabled                 BOOLEAN      NOT NULL DEFAULT FALSE,
    requires_password_setup BOOLEAN      NOT NULL DEFAULT FALSE,
    role                    VARCHAR(255)
);

CREATE TABLE groups
(
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255),
    default_currency VARCHAR(255) NOT NULL DEFAULT 'PLN',
    description      VARCHAR(1000),
    created_by_id    BIGINT REFERENCES users (id),
    created_at       TIMESTAMP,
    is_public        BOOLEAN      NOT NULL DEFAULT FALSE,
    view_token       VARCHAR(255)
);

CREATE TABLE group_currencies
(
    group_id BIGINT NOT NULL REFERENCES groups (id),
    currency VARCHAR(255)
);

CREATE TABLE group_users
(
    group_id BIGINT NOT NULL REFERENCES groups (id),
    user_id  BIGINT NOT NULL REFERENCES users (id),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE expenses
(
    id          BIGSERIAL PRIMARY KEY,
    payer_id    BIGINT REFERENCES users (id),
    amount      NUMERIC(19, 2),
    description VARCHAR(255) NOT NULL,
    date        TIMESTAMP,
    currency    VARCHAR(255) NOT NULL DEFAULT 'PLN',
    group_id    BIGINT REFERENCES groups (id),
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    is_paid     BOOLEAN,
    category    VARCHAR(255)          DEFAULT 'NO_CATEGORY_GENERAL'
);

CREATE TABLE expense_splits
(
    id          BIGSERIAL PRIMARY KEY,
    expense_id  BIGINT REFERENCES expenses (id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users (id),
    amount_owed NUMERIC(19, 2)
);

CREATE TABLE verification_token
(
    id          BIGSERIAL PRIMARY KEY,
    token       VARCHAR(255),
    user_id     BIGINT REFERENCES users (id),
    expiry_date TIMESTAMP
);

CREATE TABLE refresh_tokens
(
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id),
    token       VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP    NOT NULL
);

CREATE TABLE exchange_rate
(
    id            BIGSERIAL PRIMARY KEY,
    date          DATE         NOT NULL,
    currency_from VARCHAR(255) NOT NULL,
    rate          NUMERIC      NOT NULL,
    currency_to   VARCHAR(255) NOT NULL DEFAULT 'PLN',
    CONSTRAINT unique_exchange_rate UNIQUE (currency_from, currency_to, date)
);
