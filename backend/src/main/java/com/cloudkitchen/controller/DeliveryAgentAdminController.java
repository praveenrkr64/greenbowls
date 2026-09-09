package com.cloudkitchen.controller;

import com.cloudkitchen.dto.DeliveryAgentAdminDto;
import com.cloudkitchen.dto.DeliveryAgentAdminRequest;
import com.cloudkitchen.service.DeliveryAgentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// Admin-only: the roster of delivery agents orders can be assigned to. The agents
// themselves look up their own assigned orders publicly by phone - see OrderController.
@RestController
@RequestMapping("/api/admin/delivery-agents")
public class DeliveryAgentAdminController {

    private final DeliveryAgentService deliveryAgentService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public DeliveryAgentAdminController(DeliveryAgentService deliveryAgentService) {
        this.deliveryAgentService = deliveryAgentService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @GetMapping
    public List<DeliveryAgentAdminDto> listAll(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return deliveryAgentService.getAllAgentsForAdmin();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryAgentAdminDto create(@Valid @RequestBody DeliveryAgentAdminRequest request,
                                         @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return deliveryAgentService.createAgent(request);
    }

    @PutMapping("/{id}")
    public DeliveryAgentAdminDto update(@PathVariable Long id, @Valid @RequestBody DeliveryAgentAdminRequest request,
                                         @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return deliveryAgentService.updateAgent(id, request);
    }

    // Soft delete - see DeliveryAgentService.deactivateAgent for why this doesn't hard-remove the row.
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id, @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        deliveryAgentService.deactivateAgent(id);
    }
}
