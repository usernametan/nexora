package com.personalcosmos.api.web;

import com.personalcosmos.api.domain.AppUser;
import com.personalcosmos.api.dto.ProfileUpdateRequest;
import com.personalcosmos.api.dto.UserResponse;
import com.personalcosmos.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ProfileController {

    private final AuthService authService;

    public ProfileController(AuthService authService) {
        this.authService = authService;
    }

    @PatchMapping("/profile")
    public UserResponse updateProfile(
            @AuthenticationPrincipal AppUser user, @Valid @RequestBody ProfileUpdateRequest request) {
        return authService.updateProfile(user, request);
    }
}
