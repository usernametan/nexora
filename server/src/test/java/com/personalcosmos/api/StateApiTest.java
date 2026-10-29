package com.personalcosmos.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class StateApiTest extends ApiIntegrationTest {

    private static final String KEY = "personal-cosmos:earth:tasks";

    @Test
    void stateRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/state"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
        mockMvc.perform(put("/api/v1/state/" + KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\":{}}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void putGetAndListRoundTripRawJson() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"value": {"tasks": [{"id": 1, "title": "Drink water"}], "done": false}, "baseVersion": 0}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value(KEY))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.updatedAt").isNotEmpty())
                .andExpect(jsonPath("$.value.tasks[0].title").value("Drink water"))
                .andExpect(jsonPath("$.value.done").value(false));

        mockMvc.perform(withAuth(get("/api/v1/state/" + KEY), user.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value(KEY))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.value.tasks[0].id").value(1));

        mockMvc.perform(withAuth(get("/api/v1/state"), user.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].key").value(KEY))
                .andExpect(jsonPath("$[0].value.tasks[0].title").value("Drink water"));
    }

    @Test
    void versionIncrementsAndStaleBaseVersionConflicts() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": {\"n\": 1}, \"baseVersion\": 0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1));

        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": {\"n\": 2}, \"baseVersion\": 1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.value.n").value(2));

        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": {\"n\": 3}, \"baseVersion\": 1}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("current version is 2")));

        // No baseVersion means blind write: version still increments.
        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": {\"n\": 4}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(3));
    }

    @Test
    void creatingAKeyWithNonZeroBaseVersionConflicts() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": {\"n\": 1}, \"baseVersion\": 3}"))
                .andExpect(status().isConflict());
    }

    @Test
    void missingEntryReturns404() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(get("/api/v1/state/personal-cosmos:moon:water"), user.token()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("State entry not found"));
    }

    @Test
    void invalidKeysAndValuesAreRejected() throws Exception {
        TestUser user = registerUser();

        for (String badKey : List.of(
                "other-prefix:earth",
                "personal-cosmos:",
                "personal-cosmos:earth.tasks",
                "personal-cosmos:" + "a".repeat(110))) {
            mockMvc.perform(withAuth(put("/api/v1/state/" + badKey), user.token())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"value\": {}}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400));
        }

        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": null}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(withAuth(get("/api/v1/state/personal-cosmos:earth.tasks"), user.token()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void oversizedValueIsRejectedWith413() throws Exception {
        TestUser user = registerUser();
        Map<String, Object> body = Map.of("value", "x".repeat(1024 * 1024 + 1));

        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(body)))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.status").value(413));
    }

    @Test
    void bulkUpsertListsAndDeletes() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(put("/api/v1/state"), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"entries": [
                                  {"key": "personal-cosmos:earth:tasks", "value": {"tasks": []}, "baseVersion": 0},
                                  {"key": "personal-cosmos:moon:hydration", "value": [1, 2, 3]}
                                ]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].version").value(1))
                .andExpect(jsonPath("$[1].version").value(1));

        mockMvc.perform(withAuth(get("/api/v1/state"), user.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(withAuth(delete("/api/v1/state/personal-cosmos:earth:tasks"), user.token()))
                .andExpect(status().isNoContent());

        mockMvc.perform(withAuth(get("/api/v1/state"), user.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].key").value("personal-cosmos:moon:hydration"));

        mockMvc.perform(withAuth(delete("/api/v1/state"), user.token()))
                .andExpect(status().isNoContent());

        mockMvc.perform(withAuth(get("/api/v1/state"), user.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void bulkUpsertIsTransactionalOnConflict() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": {\"n\": 1}, \"baseVersion\": 0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1));

        mockMvc.perform(withAuth(put("/api/v1/state"), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"entries": [
                                  {"key": "personal-cosmos:earth:tasks", "value": {"n": 2}, "baseVersion": 1},
                                  {"key": "personal-cosmos:moon:water", "value": {"n": 9}, "baseVersion": 7}
                                ]}
                                """))
                .andExpect(status().isConflict());

        mockMvc.perform(withAuth(get("/api/v1/state/" + KEY), user.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.value.n").value(1));

        mockMvc.perform(withAuth(get("/api/v1/state/personal-cosmos:moon:water"), user.token()))
                .andExpect(status().isNotFound());
    }

    @Test
    void bulkUpsertRejectsMoreThan200Entries() throws Exception {
        TestUser user = registerUser();
        List<Map<String, Object>> entries = new ArrayList<>();
        for (int i = 0; i < 201; i++) {
            entries.add(Map.of("key", "personal-cosmos:bulk:" + i, "value", Map.of("i", i)));
        }

        mockMvc.perform(withAuth(put("/api/v1/state"), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(Map.of("entries", entries))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void stateIsUserScoped() throws Exception {
        TestUser alice = registerUser();
        TestUser bob = registerUser();

        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), alice.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": {\"owner\": \"alice\"}, \"baseVersion\": 0}"))
                .andExpect(status().isOk());

        mockMvc.perform(withAuth(get("/api/v1/state/" + KEY), bob.token()))
                .andExpect(status().isNotFound());

        mockMvc.perform(withAuth(get("/api/v1/state"), bob.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(withAuth(delete("/api/v1/state/" + KEY), bob.token()))
                .andExpect(status().isNotFound());

        // Bob can create the same key for himself; Alice's value is untouched.
        mockMvc.perform(withAuth(put("/api/v1/state/" + KEY), bob.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\": {\"owner\": \"bob\"}, \"baseVersion\": 0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.value.owner").value("bob"));

        mockMvc.perform(withAuth(get("/api/v1/state/" + KEY), alice.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value.owner").value("alice"))
                .andExpect(jsonPath("$.version").value(1));
    }

    @Test
    void bulkRejectsEntryWithMissingKey() throws Exception {
        TestUser user = registerUser();
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("value", Map.of("n", 1));

        mockMvc.perform(withAuth(put("/api/v1/state"), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(Map.of("entries", List.of(entry)))))
                .andExpect(status().isBadRequest());
    }
}
