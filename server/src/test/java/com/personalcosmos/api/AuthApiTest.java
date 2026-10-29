package com.personalcosmos.api;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class AuthApiTest extends ApiIntegrationTest {

    @Test
    void registerReturnsTokenAndUser() throws Exception {
        String email = "new-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "super-secret-1",
                                "name", "Grace Hopper",
                                "timezone", "America/New_York"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.id", notNullValue()))
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.name").value("Grace Hopper"))
                .andExpect(jsonPath("$.user.timezone").value("America/New_York"))
                .andExpect(jsonPath("$.user.currency").value("USD"))
                .andExpect(jsonPath("$.user.createdAt", notNullValue()));
    }

    @Test
    void registerAcceptsOptionalCurrency() throws Exception {
        String email = "currency-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "super-secret-1",
                                "name", "Currency Fan",
                                "timezone", "UTC",
                                "currency", "eur"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.currency").value("EUR"));
    }

    @Test
    void registerNormalizesEmailAndRejectsDuplicates() throws Exception {
        String email = "case-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email.toUpperCase(),
                                "password", "super-secret-1",
                                "name", "First",
                                "timezone", "UTC"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email").value(email));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "super-secret-1",
                                "name", "Second",
                                "timezone", "UTC"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value(containsString("already exists")))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/register"));
    }

    @Test
    void registerValidationErrorsIncludeFieldMessages() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "not-an-email", "password": "short", "name": " "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.errors.email", notNullValue()))
                .andExpect(jsonPath("$.errors.password", notNullValue()))
                .andExpect(jsonPath("$.errors.name", notNullValue()))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/register"));
    }

    @Test
    void loginSucceedsWithNormalizedEmail() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", user.email().toUpperCase(),
                                "password", user.password()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.id").value(user.id().toString()));
    }

    @Test
    void loginRejectsBadCredentialsWithJsonError() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", user.email(),
                                "password", "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"))
                .andExpect(jsonPath("$.timestamp", notNullValue()))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/login"));
    }

    @Test
    void meRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void meReturnsAuthenticatedUser() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(get("/api/v1/auth/me"), user.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.id().toString()))
                .andExpect(jsonPath("$.email").value(user.email()))
                .andExpect(jsonPath("$.name").value("Ada Lovelace"));
    }

    @Test
    void meRejectsMalformedToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void profilePatchUpdatesNameTimezoneAndCurrency() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(patch("/api/v1/profile"), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "  Ada L.  ", "timezone": "Europe/Berlin", "currency": "eur"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ada L."))
                .andExpect(jsonPath("$.timezone").value("Europe/Berlin"))
                .andExpect(jsonPath("$.currency").value("EUR"));

        mockMvc.perform(withAuth(get("/api/v1/auth/me"), user.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ada L."))
                .andExpect(jsonPath("$.currency").value("EUR"));
    }

    @Test
    void profilePatchSupportsPartialUpdate() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(patch("/api/v1/profile"), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currency": "gbp"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ada Lovelace"))
                .andExpect(jsonPath("$.currency").value("GBP"));
    }

    @Test
    void profilePatchRejectsInvalidCurrencyAndTimezone() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(patch("/api/v1/profile"), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currency": "EURO"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.currency", notNullValue()));

        mockMvc.perform(withAuth(patch("/api/v1/profile"), user.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"timezone": "Not/AZone"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("timezone")));
    }

    @Test
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }
}
