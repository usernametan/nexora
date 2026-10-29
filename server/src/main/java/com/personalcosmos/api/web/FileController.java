package com.personalcosmos.api.web;

import com.personalcosmos.api.domain.AppUser;
import com.personalcosmos.api.domain.StoredFile;
import com.personalcosmos.api.dto.FileResponse;
import com.personalcosmos.api.service.FileStorageService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public FileResponse upload(
            @AuthenticationPrincipal AppUser user, @RequestPart("file") MultipartFile file) {
        return fileStorageService.store(user, file);
    }

    @GetMapping
    public List<FileResponse> list(@AuthenticationPrincipal AppUser user) {
        return fileStorageService.list(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(
            @AuthenticationPrincipal AppUser user, @PathVariable UUID id) {
        StoredFile stored = fileStorageService.getMetadata(user, id);
        Resource resource = fileStorageService.loadResource(stored);
        MediaType mediaType = parseMediaType(stored.getContentType());
        ContentDisposition disposition = isInline(mediaType)
                ? ContentDisposition.inline()
                        .filename(stored.getOriginalName(), StandardCharsets.UTF_8)
                        .build()
                : ContentDisposition.attachment()
                        .filename(stored.getOriginalName(), StandardCharsets.UTF_8)
                        .build();
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(stored.getSizeBytes())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable UUID id) {
        fileStorageService.delete(user, id);
    }

    private static MediaType parseMediaType(String contentType) {
        try {
            return MediaType.parseMediaType(contentType);
        } catch (IllegalArgumentException ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private static boolean isInline(MediaType mediaType) {
        String type = mediaType.getType().toLowerCase(Locale.ROOT);
        String subtype = mediaType.getSubtype().toLowerCase(Locale.ROOT);
        return "image".equals(type)
                || ("text".equals(type) && "plain".equals(subtype))
                || ("application".equals(type) && "pdf".equals(subtype));
    }
}
