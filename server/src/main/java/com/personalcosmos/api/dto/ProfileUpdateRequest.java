package com.personalcosmos.api.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Partial profile update: null fields are left unchanged.
 */
public record ProfileUpdateRequest(
        @Size(max = 120, message = "name must be at most 120 characters")
        String name,

        @Size(max = 64, message = "timezone must be at most 64 characters")
        String timezone,

        @Pattern(regexp = "^[A-Za-z]{3}$", message = "currency must be a 3-letter currency code")
        String currency) {
}
