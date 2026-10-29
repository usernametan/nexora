package com.personalcosmos.api.dto;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Body of PUT /state/{key}. {@code baseVersion} is optional; when present it
 * must match the currently stored version (0 for a key that does not exist).
 */
public record StatePutRequest(JsonNode value, Long baseVersion) {
}
