package com.cloudkitchen.controller;

import com.cloudkitchen.dto.MenuItemAdminDto;
import com.cloudkitchen.dto.MenuItemAdminRequest;
import com.cloudkitchen.dto.UpdateSortOrderRequest;
import com.cloudkitchen.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// Admin-only menu management: add/edit/deactivate dishes. Kept separate from
// MenuController, which only ever serves the public, active-items-only /api/menu.
@RestController
@RequestMapping("/api/admin/menu")
public class MenuAdminController {

    private final MenuService menuService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public MenuAdminController(MenuService menuService) {
        this.menuService = menuService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @GetMapping
    public List<MenuItemAdminDto> listAll(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return menuService.getAllMenuForAdmin();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItemAdminDto create(@Valid @RequestBody MenuItemAdminRequest request,
                                    @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return menuService.createItem(request);
    }

    @PutMapping("/{id}")
    public MenuItemAdminDto update(@PathVariable Long id, @Valid @RequestBody MenuItemAdminRequest request,
                                    @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return menuService.updateItem(id, request);
    }

    // Reorder within a category, or "promote" an item by giving it a lower sortOrder
    // than its neighbors - lighter than PUT since it doesn't touch variantGroups.
    @PatchMapping("/{id}/sort-order")
    public MenuItemAdminDto updateSortOrder(@PathVariable Long id, @Valid @RequestBody UpdateSortOrderRequest request,
                                             @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return menuService.updateSortOrder(id, request.getSortOrder());
    }

    // Soft delete - see MenuService.deactivateItem for why this doesn't hard-remove the row.
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id, @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        menuService.deactivateItem(id);
    }
}
