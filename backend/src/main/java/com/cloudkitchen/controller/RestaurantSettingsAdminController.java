package com.cloudkitchen.controller;

import com.cloudkitchen.dto.RestaurantSettingsAdminDto;
import com.cloudkitchen.dto.RestaurantSettingsAdminRequest;
import com.cloudkitchen.service.RestaurantSettingsService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

// Admin-only: the restaurant's display name (with optional inline CSS styling), contact
// phone, and notification email. The public /api/restaurant-info (MenuController) omits
// adminEmail entirely - reading THAT full picture, and changing anything, both require
// the admin key here.
@RestController
@RequestMapping("/api/admin/restaurant-info")
public class RestaurantSettingsAdminController {

    private final RestaurantSettingsService restaurantSettingsService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public RestaurantSettingsAdminController(RestaurantSettingsService restaurantSettingsService) {
        this.restaurantSettingsService = restaurantSettingsService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @GetMapping
    public RestaurantSettingsAdminDto get(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return restaurantSettingsService.getSettingsForAdmin();
    }

    @PutMapping
    public RestaurantSettingsAdminDto update(@Valid @RequestBody RestaurantSettingsAdminRequest request,
                                              @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return restaurantSettingsService.updateSettings(request);
    }
}
