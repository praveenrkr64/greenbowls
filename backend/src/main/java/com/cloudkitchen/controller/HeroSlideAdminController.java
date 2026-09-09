package com.cloudkitchen.controller;

import com.cloudkitchen.dto.HeroSlideAdminDto;
import com.cloudkitchen.dto.HeroSlideAdminRequest;
import com.cloudkitchen.service.HeroSlideService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// Admin-only: the images in the rotating banner at the top of the customer menu.
// Upload the file via /api/admin/uploads first, then store the URL it returns here.
// Reading the enabled ones is public - see MenuController.getHeroSlides.
@RestController
@RequestMapping("/api/admin/hero-slides")
public class HeroSlideAdminController {

    private final HeroSlideService heroSlideService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public HeroSlideAdminController(HeroSlideService heroSlideService) {
        this.heroSlideService = heroSlideService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @GetMapping
    public List<HeroSlideAdminDto> listAll(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return heroSlideService.getAllSlidesForAdmin();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HeroSlideAdminDto create(@Valid @RequestBody HeroSlideAdminRequest request,
                                     @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return heroSlideService.createSlide(request);
    }

    @PutMapping("/{id}")
    public HeroSlideAdminDto update(@PathVariable Long id, @Valid @RequestBody HeroSlideAdminRequest request,
                                     @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return heroSlideService.updateSlide(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        heroSlideService.deleteSlide(id);
    }
}
