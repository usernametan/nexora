package com.personalcosmos.api.service;

import com.personalcosmos.api.domain.AppUser;
import com.personalcosmos.api.domain.StoredFile;
import com.personalcosmos.api.dto.FileResponse;
import com.personalcosmos.api.repository.StoredFileRepository;
import com.personalcosmos.api.web.error.ApiException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Stores file bytes on local disk under a generated name. Client filenames are
 * never used to build a path, and every resolved path is checked to stay inside
 * the configured storage root.
 */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private static final int MAX_NAME_LENGTH = 255;
    public static final long MAX_FILE_BYTES = 20L * 1024 * 1024;

    private final StoredFileRepository storedFileRepository;
    private final Path root;

    public FileStorageService(
            StoredFileRepository storedFileRepository,
            @Value("${app.file-storage-dir:./data/uploads}") String storageDir) {
        this.storedFileRepository = storedFileRepository;
        this.root = Path.of(storageDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not create file storage directory " + root, ex);
        }
    }

    public Path getStorageRoot() {
        return root;
    }

    @Transactional
    public FileResponse store(AppUser user, MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() == 0) {
            throw ApiException.badRequest("Uploaded file must not be empty");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw ApiException.tooLarge("Uploaded file exceeds the 20 MB limit");
        }
        String originalName = sanitizeFilename(file.getOriginalFilename());
        String contentType = sanitizeContentType(file.getContentType());
        String generatedName = UUID.randomUUID() + extensionOf(originalName);
        Path target = root.resolve(generatedName).normalize();
        if (!target.startsWith(root)) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not determine storage path");
        }
        try (InputStream input = file.getInputStream()) {
            Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            log.error("Failed to store upload for user {}", user.getId(), ex);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store uploaded file");
        }
        try {
            StoredFile stored =
                    new StoredFile(user, originalName, contentType, file.getSize(), generatedName);
            storedFileRepository.save(stored);
            return FileResponse.from(stored);
        } catch (RuntimeException ex) {
            try {
                Files.deleteIfExists(target);
            } catch (IOException cleanupFailure) {
                log.warn("Could not clean up orphaned upload {}", target, cleanupFailure);
            }
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public List<FileResponse> list(AppUser user) {
        return storedFileRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
                .map(FileResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public StoredFile getMetadata(AppUser user, UUID id) {
        return storedFileRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() -> ApiException.notFound("File not found"));
    }

    public Resource loadResource(StoredFile storedFile) {
        Path path = root.resolve(storedFile.getStoragePath()).normalize();
        if (!path.startsWith(root)) {
            throw ApiException.notFound("File not found");
        }
        try {
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw ApiException.notFound("File not found");
            }
            return resource;
        } catch (java.net.MalformedURLException ex) {
            throw ApiException.notFound("File not found");
        }
    }

    @Transactional
    public void delete(AppUser user, UUID id) {
        StoredFile stored = getMetadata(user, id);
        storedFileRepository.delete(stored);
        Path path = root.resolve(stored.getStoragePath()).normalize();
        if (!path.startsWith(root)) {
            log.warn("Refusing to delete file outside storage root: {}", stored.getStoragePath());
            return;
        }
        try {
            Files.deleteIfExists(path);
        } catch (IOException ex) {
            log.warn("Could not delete stored file {} for file id {}", path, id, ex);
        }
    }

    static String sanitizeFilename(String original) {
        if (original == null || original.isBlank()) {
            return "file";
        }
        String name = original;
        int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        name = name.replaceAll("[\\p{Cntrl}]", "").trim();
        if (name.isEmpty() || name.equals(".") || name.equals("..")) {
            return "file";
        }
        if (name.length() > MAX_NAME_LENGTH) {
            name = name.substring(name.length() - MAX_NAME_LENGTH);
        }
        return name;
    }

    static String sanitizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        try {
            String parsed = MediaType.parseMediaType(contentType.trim()).toString();
            return parsed.length() > 255 ? MediaType.APPLICATION_OCTET_STREAM_VALUE : parsed;
        } catch (IllegalArgumentException ex) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot <= 0 || dot == filename.length() - 1) {
            return "";
        }
        String extension = filename.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (extension.length() > 10 || !extension.matches("[a-z0-9]+")) {
            return "";
        }
        return "." + extension;
    }
}
