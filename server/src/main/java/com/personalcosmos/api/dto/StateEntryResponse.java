package com.personalcosmos.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

public record StateEntryResponse(String key, JsonNode value, long version, Instant updatedAt) {
}
