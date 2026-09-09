package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;

// Used for both create and update.
public class CategoryAdminRequest {
    @NotBlank
    private String name;

    private String description;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
