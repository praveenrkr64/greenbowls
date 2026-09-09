package com.cloudkitchen.controller;

import com.cloudkitchen.dto.PromoBannerAdminDto;
import com.cloudkitchen.dto.PromoBannerAdminRequest;
import com.cloudkitchen.service.PromoBannerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// Admin-only: the roster of promotion banners shown above the customer menu. Any
// number can be enabled at once. Reading the active ones is public - see
// MenuController.getPromoBanners.
@RestController
@RequestMapping("/api/admin/promo-banners")
public class PromoBannerAdminController {

    private final PromoBannerService promoBannerService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public PromoBannerAdminController(PromoBannerService promoBannerService) {
        this.promoBannerService = promoBannerService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @GetMapping
    public List<PromoBannerAdminDto> listAll(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return promoBannerService.getAllBannersForAdmin();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PromoBannerAdminDto create(@Valid @RequestBody PromoBannerAdminRequest request,
                                       @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return promoBannerService.createBanner(request);
    }

    @PutMapping("/{id}")
    public PromoBannerAdminDto update(@PathVariable Long id, @Valid @RequestBody PromoBannerAdminRequest request,
                                       @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return promoBannerService.updateBanner(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        promoBannerService.deleteBanner(id);
    }
}
