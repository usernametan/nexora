package com.personalcosmos.api.repository;

import com.personalcosmos.api.domain.AppUser;
import com.personalcosmos.api.domain.UserState;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserStateRepository extends JpaRepository<UserState, UUID> {

    Optional<UserState> findByUserAndStateKey(AppUser user, String stateKey);

    List<UserState> findAllByUserOrderByStateKeyAsc(AppUser user);

    void deleteByUserAndStateKey(AppUser user, String stateKey);

    void deleteByUser(AppUser user);
}
