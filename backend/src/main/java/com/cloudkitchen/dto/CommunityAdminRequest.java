package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// Used for both create and update.
public class CommunityAdminRequest {

    @NotBlank
    private String name;

    private boolean active = true;

    @NotBlank
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "color must be a hex value like #33562e")
    private String color;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
