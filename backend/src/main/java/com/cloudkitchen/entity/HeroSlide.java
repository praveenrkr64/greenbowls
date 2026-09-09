package com.cloudkitchen.entity;

import jakarta.persistence.*;

// One image in the rotating banner at the top of the customer menu page. Replaces the
// single RestaurantSettings.heroImageUrl, which stays in place as a fallback so the
// banner already live in production keeps showing until slides are added here - see
// HeroSlideService.getActiveSlides.
@Entity
@Table(name = "hero_slides")
public class HeroSlide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private boolean enabled = true;

    // Long enough for an absolute upload URL; these come from MediaUploadController,
    // which returns the full origin plus /uploads/<uuid>.<ext>.
    @Column(nullable = false, length = 500)
    private String imageUrl;

    // Ascending: lowest shows first. Ties fall back to id, so slides added without a
    // deliberate order still appear oldest-first rather than in an arbitrary order.
    @Column(nullable = false)
    private int sortOrder = 0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
