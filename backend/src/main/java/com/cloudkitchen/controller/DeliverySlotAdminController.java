package com.cloudkitchen.controller;

import com.cloudkitchen.dto.DeliverySlotAdminDto;
import com.cloudkitchen.dto.DeliverySlotAdminRequest;
import com.cloudkitchen.service.DeliverySlotService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// Admin-only: configure the delivery windows customers choose from at checkout.
@RestController
@RequestMapping("/api/admin/delivery-slots")
public class DeliverySlotAdminController {

    private final DeliverySlotService deliverySlotService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public DeliverySlotAdminController(DeliverySlotService deliverySlotService) {
        this.deliverySlotService = deliverySlotService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @GetMapping
    public List<DeliverySlotAdminDto> listAll(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return deliverySlotService.getAllForAdmin();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliverySlotAdminDto create(@Valid @RequestBody DeliverySlotAdminRequest request,
                                        @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return deliverySlotService.create(request);
    }

    @PutMapping("/{id}")
    public DeliverySlotAdminDto update(@PathVariable Long id,
                                        @Valid @RequestBody DeliverySlotAdminRequest request,
                                        @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return deliverySlotService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,
                        @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        deliverySlotService.delete(id);
    }
}
