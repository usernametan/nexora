-- Personal Cosmos backend schema (PostgreSQL).
-- Flyway runs this migration only in the prod profile.

CREATE TABLE app_users (
    id            UUID PRIMARY KEY,
    email         VARCHAR(320) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    name          VARCHAR(120) NOT NULL,
    timezone      VARCHAR(64)  NOT NULL DEFAULT 'UTC',
    currency      VARCHAR(3)   NOT NULL DEFAULT 'USD',
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_app_users_email UNIQUE (email)
);

CREATE TABLE user_states (
    id           UUID PRIMARY KEY,
    user_id      UUID         NOT NULL,
    state_key    VARCHAR(120) NOT NULL,
    state_value  TEXT         NOT NULL,
    version_no   BIGINT       NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_user_states_user FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE,
    CONSTRAINT uk_user_states_user_key UNIQUE (user_id, state_key)
);

CREATE INDEX idx_user_states_user_id ON user_states (user_id);

CREATE TABLE stored_files (
    id            UUID PRIMARY KEY,
    user_id       UUID         NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type  VARCHAR(255) NOT NULL,
    size_bytes    BIGINT       NOT NULL,
    storage_path  VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_stored_files_user FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
);

CREATE INDEX idx_stored_files_user_id ON stored_files (user_id);
