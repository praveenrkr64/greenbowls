package com.cloudkitchen.controller;

import com.cloudkitchen.dto.CategoryAdminRequest;
import com.cloudkitchen.dto.CategoryDto;
import com.cloudkitchen.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// Admin-only: category descriptions shown on the customer menu page. Reading them
// is public - see MenuController.getCategories.
@RestController
@RequestMapping("/api/admin/categories")
public class CategoryAdminController {

    private final CategoryService categoryService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public CategoryAdminController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @GetMapping
    public List<CategoryDto> listAll(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return categoryService.getAllCategories();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto create(@Valid @RequestBody CategoryAdminRequest request,
                               @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return categoryService.createCategory(request);
    }

    @PutMapping("/{id}")
    public CategoryDto update(@PathVariable Long id, @Valid @RequestBody CategoryAdminRequest request,
                               @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return categoryService.updateCategory(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        categoryService.deleteCategory(id);
    }
}
