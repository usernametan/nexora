package com.personalcosmos.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.personalcosmos.api.domain.AppUser;
import com.personalcosmos.api.domain.UserState;
import com.personalcosmos.api.dto.StateBulkRequest.StateEntryInput;
import com.personalcosmos.api.dto.StateEntryResponse;
import com.personalcosmos.api.repository.UserStateRepository;
import com.personalcosmos.api.web.error.ApiException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * User-scoped persistence for the localStorage-style state documents.
 */
@Service
public class StateService {

    public static final String KEY_PREFIX = "personal-cosmos:";
    public static final int MAX_KEY_LENGTH = 120;
    public static final int MAX_VALUE_BYTES = 1024 * 1024;
    public static final int MAX_BULK_ENTRIES = 200;

    private static final Pattern KEY_PATTERN =
            Pattern.compile("^personal-cosmos:[A-Za-z0-9:_-]{1," + (MAX_KEY_LENGTH - KEY_PREFIX.length()) + "}$");

    private final UserStateRepository stateRepository;
    private final ObjectMapper objectMapper;

    public StateService(UserStateRepository stateRepository, ObjectMapper objectMapper) {
        this.stateRepository = stateRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<StateEntryResponse> list(AppUser user) {
        List<StateEntryResponse> responses = new ArrayList<>();
        for (UserState state : stateRepository.findAllByUserOrderByStateKeyAsc(user)) {
            responses.add(toResponse(state));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public StateEntryResponse get(AppUser user, String key) {
        validateKey(key);
        return stateRepository
                .findByUserAndStateKey(user, key)
                .map(this::toResponse)
                .orElseThrow(() -> ApiException.notFound("State entry not found"));
    }

    @Transactional
    public StateEntryResponse put(AppUser user, String key, JsonNode value, Long baseVersion) {
        validateKey(key);
        String serialized = serialize(value);
        UserState state = stateRepository.findByUserAndStateKey(user, key).orElse(null);
        return apply(user, key, serialized, baseVersion, state);
    }

    @Transactional
    public List<StateEntryResponse> putAll(AppUser user, List<StateEntryInput> entries) {
        if (entries == null || entries.isEmpty()) {
            throw ApiException.badRequest("entries must not be empty");
        }
        if (entries.size() > MAX_BULK_ENTRIES) {
            throw ApiException.badRequest("entries must contain at most " + MAX_BULK_ENTRIES + " entries");
        }
        List<StateEntryResponse> responses = new ArrayList<>(entries.size());
        for (StateEntryInput entry : entries) {
            if (entry == null) {
                throw ApiException.badRequest("entry must not be null");
            }
            validateKey(entry.key());
            String serialized = serialize(entry.value());
            UserState existing =
                    stateRepository.findByUserAndStateKey(user, entry.key()).orElse(null);
            responses.add(apply(user, entry.key(), serialized, entry.baseVersion(), existing));
        }
        return responses;
    }

    @Transactional
    public void delete(AppUser user, String key) {
        validateKey(key);
        UserState state = stateRepository
                .findByUserAndStateKey(user, key)
                .orElseThrow(() -> ApiException.notFound("State entry not found"));
        stateRepository.delete(state);
    }

    @Transactional
    public void deleteAll(AppUser user) {
        stateRepository.deleteByUser(user);
    }

    private StateEntryResponse apply(
            AppUser user, String key, String serialized, Long baseVersion, UserState existing) {
        if (existing == null) {
            long currentVersion = 0L;
            if (baseVersion != null && baseVersion != currentVersion) {
                throw versionConflict(key, currentVersion);
            }
            UserState created = new UserState(user, key, serialized);
            stateRepository.save(created);
            return toResponse(created);
        }
        if (baseVersion != null && baseVersion != existing.getVersion()) {
            throw versionConflict(key, existing.getVersion());
        }
        existing.setValue(serialized);
        existing.setVersion(existing.getVersion() + 1);
        existing.setUpdatedAt(Instant.now());
        return toResponse(existing);
    }

    private static ApiException versionConflict(String key, long currentVersion) {
        return ApiException.conflict(
                "Version conflict for state key '" + key + "': current version is " + currentVersion);
    }

    static void validateKey(String key) {
        if (key == null || key.isEmpty()) {
            throw ApiException.badRequest("key is required");
        }
        if (key.length() > MAX_KEY_LENGTH) {
            throw ApiException.badRequest("key must be at most " + MAX_KEY_LENGTH + " characters");
        }
        if (!KEY_PATTERN.matcher(key).matches()) {
            throw ApiException.badRequest(
                    "key must start with '" + KEY_PREFIX
                            + "' and contain only letters, digits, colons, underscores and hyphens");
        }
    }

    private String serialize(JsonNode value) {
        if (value == null || value.isNull() || value.isMissingNode()) {
            throw ApiException.badRequest("value must not be null");
        }
        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(value);
        } catch (JsonProcessingException ex) {
            throw ApiException.badRequest("value is not valid JSON");
        }
        if (bytes.length > MAX_VALUE_BYTES) {
            throw ApiException.tooLarge("value must be at most 1 MiB of JSON");
        }
        return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
    }

    private StateEntryResponse toResponse(UserState state) {
        JsonNode value;
        try {
            value = objectMapper.readTree(state.getValue());
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Corrupt JSON stored for state key " + state.getStateKey(), ex);
        }
        return new StateEntryResponse(state.getStateKey(), value, state.getVersion(), state.getUpdatedAt());
    }
}
