package com.cloudkitchen.service;

import com.cloudkitchen.dto.CategoryAdminRequest;
import com.cloudkitchen.dto.CategoryDto;
import com.cloudkitchen.entity.Category;
import com.cloudkitchen.repository.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(this::toDto).toList();
    }

    @Transactional
    public CategoryDto createCategory(CategoryAdminRequest request) {
        requireUniqueName(request.getName(), null);
        Category category = new Category();
        applyRequest(category, request);
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CategoryAdminRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        requireUniqueName(request.getName(), id);
        applyRequest(category, request);
        return toDto(categoryRepository.save(category));
    }

    // Real delete, not soft-delete - MenuItem.category is a free-text string, not a
    // foreign key to this table, so removing a Category row just drops its
    // description; existing menu items keep their category string untouched.
    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found");
        }
        categoryRepository.deleteById(id);
    }

    private void requireUniqueName(String name, Long excludingId) {
        categoryRepository.findAllByOrderByNameAsc().stream()
                .filter(c -> c.getName().equalsIgnoreCase(name) && (excludingId == null || !c.getId().equals(excludingId)))
                .findFirst()
                .ifPresent(c -> {
                    throw new IllegalArgumentException("A category named \"" + name + "\" already exists");
                });
    }

    private void applyRequest(Category category, CategoryAdminRequest request) {
        category.setName(request.getName().trim());
        String description = request.getDescription();
        category.setDescription(description == null || description.isBlank() ? null : description.trim());
    }

    private CategoryDto toDto(Category category) {
        return new CategoryDto(category.getId(), category.getName(), category.getDescription());
    }
}
