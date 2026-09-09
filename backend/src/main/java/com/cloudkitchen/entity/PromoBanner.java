package com.cloudkitchen.entity;

import jakarta.persistence.*;

// One row per promotional banner shown above the customer menu (e.g. "10% off Chicken
// Rice Bowl today only!") - any number can be enabled at once, unlike the old single
// site-wide banner. Table renamed from "promo_banner" (singleton) to "promo_banners"
// (list) rather than migrating the old row's PK generation strategy in place.
@Entity
@Table(name = "promo_banners")
public class PromoBanner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false, length = 300)
    private String message;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
