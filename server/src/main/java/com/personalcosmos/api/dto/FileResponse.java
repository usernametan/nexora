package com.personalcosmos.api.dto;

import com.personalcosmos.api.domain.StoredFile;
import java.time.Instant;
import java.util.UUID;

public record FileResponse(
        UUID id, String name, String contentType, long size, String downloadUrl, Instant createdAt) {

    public static FileResponse from(StoredFile file) {
        return new FileResponse(
                file.getId(),
                file.getOriginalName(),
                file.getContentType(),
                file.getSizeBytes(),
                "/api/v1/files/" + file.getId(),
                file.getCreatedAt());
    }
}
