package com.personalcosmos.api.repository;

import com.personalcosmos.api.domain.AppUser;
import com.personalcosmos.api.domain.StoredFile;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findByIdAndUser(UUID id, AppUser user);

    List<StoredFile> findAllByUserOrderByCreatedAtDesc(AppUser user);
}
