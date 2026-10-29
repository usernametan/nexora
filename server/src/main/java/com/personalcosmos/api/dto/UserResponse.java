package com.personalcosmos.api.dto;

import com.personalcosmos.api.domain.AppUser;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(UUID id, String email, String name, String timezone, String currency, Instant createdAt) {

    public static UserResponse from(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getTimezone(),
                user.getCurrency(),
                user.getCreatedAt());
    }
}
