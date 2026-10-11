package com.cloudkitchen.controller;

import com.cloudkitchen.dto.SubscriptionRequestCreate;
import com.cloudkitchen.dto.SubscriptionRequestDto;
import com.cloudkitchen.dto.SubscriptionRequestUpdate;
import com.cloudkitchen.service.SubscriptionRequestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Creating a request is PUBLIC - it is a customer asking to be called. Reading and working
 * through them is admin-only, like the order list.
 */
@RestController
@RequestMapping("/api")
public class SubscriptionRequestController {

    private final SubscriptionRequestService service;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public SubscriptionRequestController(SubscriptionRequestService service) {
        this.service = service;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @PostMapping("/subscription-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionRequestDto create(@Valid @RequestBody SubscriptionRequestCreate request) {
        return service.create(request);
    }

    @GetMapping("/admin/subscription-requests")
    public List<SubscriptionRequestDto> listAll(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return service.getAllForAdmin();
    }

    @PutMapping("/admin/subscription-requests/{id}")
    public SubscriptionRequestDto update(@PathVariable Long id,
                                          @Valid @RequestBody SubscriptionRequestUpdate request,
                                          @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return service.update(id, request);
    }

    @DeleteMapping("/admin/subscription-requests/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,
                       @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        service.delete(id);
    }
}
