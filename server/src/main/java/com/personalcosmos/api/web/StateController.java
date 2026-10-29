package com.personalcosmos.api.web;

import com.personalcosmos.api.domain.AppUser;
import com.personalcosmos.api.dto.StateBulkRequest;
import com.personalcosmos.api.dto.StateEntryResponse;
import com.personalcosmos.api.dto.StatePutRequest;
import com.personalcosmos.api.service.StateService;
import com.personalcosmos.api.web.error.ApiException;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/state")
public class StateController {

    private final StateService stateService;

    public StateController(StateService stateService) {
        this.stateService = stateService;
    }

    @GetMapping
    public List<StateEntryResponse> list(@AuthenticationPrincipal AppUser user) {
        return stateService.list(user);
    }

    @GetMapping("/{key}")
    public StateEntryResponse get(@AuthenticationPrincipal AppUser user, @PathVariable String key) {
        return stateService.get(user, key);
    }

    @PutMapping("/{key}")
    public StateEntryResponse put(
            @AuthenticationPrincipal AppUser user,
            @PathVariable String key,
            @RequestBody StatePutRequest request) {
        if (request == null) {
            throw ApiException.badRequest("value must not be null");
        }
        return stateService.put(user, key, request.value(), request.baseVersion());
    }

    @PutMapping
    public List<StateEntryResponse> putAll(
            @AuthenticationPrincipal AppUser user, @Valid @RequestBody StateBulkRequest request) {
        return stateService.putAll(user, request.entries());
    }

    @DeleteMapping("/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable String key) {
        stateService.delete(user, key);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAll(@AuthenticationPrincipal AppUser user) {
        stateService.deleteAll(user);
    }
}
