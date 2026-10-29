package com.personalcosmos.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record StateBulkRequest(
        @NotEmpty(message = "entries must not be empty")
        @Size(max = 200, message = "entries must contain at most 200 entries")
        List<@NotNull(message = "entry must not be null") @Valid StateEntryInput> entries) {

    public record StateEntryInput(JsonNode value, Long baseVersion, @NotNull(message = "key is required") String key) {
    }
}
