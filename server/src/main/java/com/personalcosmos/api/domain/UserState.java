package com.personalcosmos.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;

/**
 * One persisted localStorage-style value for a user. The value is a JSON
 * document kept as text; the API layer serialises/deserialises it as JSON.
 */
@Entity
@Table(
        name = "user_states",
        uniqueConstraints = @UniqueConstraint(name = "uk_user_states_user_key", columnNames = {"user_id", "state_key"}))
public class UserState {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "state_key", nullable = false, length = 120)
    private String stateKey;

    @Column(name = "state_value", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(name = "version_no", nullable = false)
    private long version;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserState() {
        // JPA
    }

    public UserState(AppUser user, String stateKey, String value) {
        this.user = user;
        this.stateKey = stateKey;
        this.value = value;
        this.version = 1L;
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getStateKey() {
        return stateKey;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public long getVersion() {
        return version;
    }

    public void setVersion(long version) {
        this.version = version;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
