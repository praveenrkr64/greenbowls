package com.cloudkitchen.controller;

import com.cloudkitchen.dto.CommunityAdminDto;
import com.cloudkitchen.dto.CommunityAdminRequest;
import com.cloudkitchen.service.CommunityService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// Admin-only: which apartment communities delivery is available to, and the color used
// to tell their orders apart at a glance. Kept separate from MenuController, which only
// ever serves the public, active-only /api/communities.
@RestController
@RequestMapping("/api/admin/communities")
public class CommunityAdminController {

    private final CommunityService communityService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public CommunityAdminController(CommunityService communityService) {
        this.communityService = communityService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @GetMapping
    public List<CommunityAdminDto> listAll(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return communityService.getAllCommunitiesForAdmin();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityAdminDto create(@Valid @RequestBody CommunityAdminRequest request,
                                     @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return communityService.createCommunity(request);
    }

    @PutMapping("/{id}")
    public CommunityAdminDto update(@PathVariable Long id, @Valid @RequestBody CommunityAdminRequest request,
                                     @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return communityService.updateCommunity(id, request);
    }

    // Soft delete - see CommunityService.deactivateCommunity for why this doesn't hard-remove the row.
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id, @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        communityService.deactivateCommunity(id);
    }
}
