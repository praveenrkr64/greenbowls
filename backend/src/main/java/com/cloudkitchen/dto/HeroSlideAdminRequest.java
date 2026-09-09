package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;

// Used for both create and update.
public class HeroSlideAdminRequest {
    private boolean enabled = true;

    // The admin uploads via /api/admin/uploads and stores the returned URL here, so this
    // is always already a URL by the time it arrives - no file handling on this path.
    @NotBlank
    private String imageUrl;

    private int sortOrder = 0;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
