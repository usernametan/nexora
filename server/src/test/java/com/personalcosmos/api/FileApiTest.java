package com.personalcosmos.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.personalcosmos.api.service.FileStorageService;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

class FileApiTest extends ApiIntegrationTest {

    @Autowired
    private FileStorageService fileStorageService;

    @Test
    void uploadDownloadListAndDelete() throws Exception {
        TestUser user = registerUser();
        MockMultipartFile file = new MockMultipartFile(
                "file", "knowledge/notes.txt", "text/plain", "hello mars".getBytes(StandardCharsets.UTF_8));

        MvcResult upload = mockMvc.perform(withAuth(multipart("/api/v1/files").file(file), user.token()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("notes.txt"))
                .andExpect(jsonPath("$.contentType").value("text/plain"))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.downloadUrl").value(org.hamcrest.Matchers.startsWith("/api/v1/files/")))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andReturn();
        String id = objectMapper.readTree(upload.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(withAuth(get("/api/v1/files/" + id), user.token()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("notes.txt")))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("inline")))
                .andExpect(result -> assertThat(result.getResponse().getContentAsString()).isEqualTo("hello mars"));

        mockMvc.perform(withAuth(get("/api/v1/files"), user.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].name").value("notes.txt"));

        mockMvc.perform(withAuth(delete("/api/v1/files/" + id), user.token()))
                .andExpect(status().isNoContent());

        mockMvc.perform(withAuth(get("/api/v1/files/" + id), user.token()))
                .andExpect(status().isNotFound());

        mockMvc.perform(withAuth(get("/api/v1/files"), user.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void fileEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/files"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(multipart("/api/v1/files")
                        .file(new MockMultipartFile("file", "a.txt", "text/plain", "a".getBytes())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void emptyUploadIsRejected() throws Exception {
        TestUser user = registerUser();
        MockMultipartFile empty = new MockMultipartFile("file", "empty.txt", "text/plain", new byte[0]);

        mockMvc.perform(withAuth(multipart("/api/v1/files").file(empty), user.token()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("empty")));
    }

    @Test
    void missingFilePartIsRejected() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(multipart("/api/v1/files"), user.token()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void filesAreUserScoped() throws Exception {
        TestUser alice = registerUser();
        TestUser bob = registerUser();
        MockMultipartFile file =
                new MockMultipartFile("file", "secret.pdf", "application/pdf", "pdf-bytes".getBytes());

        MvcResult upload = mockMvc.perform(withAuth(multipart("/api/v1/files").file(file), alice.token()))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode body = objectMapper.readTree(upload.getResponse().getContentAsString());
        String id = body.get("id").asText();

        mockMvc.perform(withAuth(get("/api/v1/files/" + id), bob.token()))
                .andExpect(status().isNotFound());
        mockMvc.perform(withAuth(delete("/api/v1/files/" + id), bob.token()))
                .andExpect(status().isNotFound());
        mockMvc.perform(withAuth(get("/api/v1/files"), bob.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // Alice can still download her file.
        mockMvc.perform(withAuth(get("/api/v1/files/" + id), alice.token()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("inline")))
                .andExpect(result -> assertThat(result.getResponse().getContentAsString()).isEqualTo("pdf-bytes"));
    }

    @Test
    void storageUsesGeneratedNamesAndSanitizesClientFilename() throws Exception {
        TestUser user = registerUser();
        Set<String> before = storedFilenames();
        MockMultipartFile file = new MockMultipartFile(
                "file", "../../../etc/passwd.txt", "text/plain", "not-really".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(withAuth(multipart("/api/v1/files").file(file), user.token()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("passwd.txt"));

        Set<String> added = storedFilenames();
        added.removeAll(before);
        assertThat(added).hasSize(1);
        String storedName = added.iterator().next();
        assertThat(storedName).isNotEqualTo("passwd.txt");
        assertThat(storedName).matches("[0-9a-f-]{36}\\.txt");
        assertThat(Files.exists(fileStorageService.getStorageRoot().resolve(storedName))).isTrue();
    }

    private Set<String> storedFilenames() throws Exception {
        try (Stream<Path> files = Files.list(fileStorageService.getStorageRoot())) {
            return files.map(path -> path.getFileName().toString()).collect(Collectors.toSet());
        }
    }

    @Test
    void unknownFileReturns404() throws Exception {
        TestUser user = registerUser();

        mockMvc.perform(withAuth(get("/api/v1/files/" + UUID.randomUUID()), user.token()))
                .andExpect(status().isNotFound());

        mockMvc.perform(withAuth(get("/api/v1/files/not-a-uuid"), user.token()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void defaultContentTypeIsOctetStream() throws Exception {
        TestUser user = registerUser();
        MockMultipartFile file =
                new MockMultipartFile("file", "blob.bin", null, new byte[] {1, 2, 3});

        mockMvc.perform(withAuth(multipart("/api/v1/files").file(file), user.token()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentType").value(MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .andExpect(jsonPath("$.name").value("blob.bin"));
    }
}
