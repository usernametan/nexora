package com.personalcosmos.api.service;

import com.personalcosmos.api.domain.AppUser;
import com.personalcosmos.api.dto.AuthResponse;
import com.personalcosmos.api.dto.LoginRequest;
import com.personalcosmos.api.dto.ProfileUpdateRequest;
import com.personalcosmos.api.dto.RegisterRequest;
import com.personalcosmos.api.dto.UserResponse;
import com.personalcosmos.api.repository.AppUserRepository;
import com.personalcosmos.api.security.JwtService;
import com.personalcosmos.api.web.error.ApiException;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            AppUserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        String timezone = normalizeTimezone(request.timezone());
        String currency = request.currency() == null
                ? "USD"
                : request.currency().trim().toUpperCase(Locale.ROOT);
        AppUser user = new AppUser(
                email, passwordEncoder.encode(request.password()), request.name().trim(), timezone, currency);
        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            // Handles the race between existsByEmail and the unique constraint.
            throw ApiException.conflict("An account with this email already exists");
        }
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        AppUser user = userRepository
                .findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    @Transactional
    public UserResponse updateProfile(AppUser principal, ProfileUpdateRequest request) {
        AppUser user = userRepository
                .findById(principal.getId())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (request.name() != null) {
            String name = request.name().trim();
            if (name.isEmpty()) {
                throw ApiException.badRequest("name must not be blank");
            }
            user.setName(name);
        }
        if (request.timezone() != null) {
            user.setTimezone(normalizeTimezone(request.timezone()));
        }
        if (request.currency() != null) {
            user.setCurrency(request.currency().trim().toUpperCase(Locale.ROOT));
        }
        return UserResponse.from(user);
    }

    public static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizeTimezone(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return "UTC";
        }
        String trimmed = timezone.trim();
        try {
            ZoneId.of(trimmed);
        } catch (DateTimeException ex) {
            throw ApiException.badRequest("timezone must be a valid IANA time zone");
        }
        return trimmed;
    }
}
