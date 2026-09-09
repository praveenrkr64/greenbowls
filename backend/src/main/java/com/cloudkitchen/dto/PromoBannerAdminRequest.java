package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;

// Used for both create and update.
public class PromoBannerAdminRequest {
    private boolean enabled = true;

    @NotBlank
    private String message;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
