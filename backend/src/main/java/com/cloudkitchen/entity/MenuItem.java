package com.cloudkitchen.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    // Optional - when set, this is what's actually charged and basePrice is shown
    // struck through next to it so the customer sees the price drop. Null means no
    // discount is running on this item.
    @Column(precision = 10, scale = 2)
    private BigDecimal discountedPrice;

    // e.g. BOWL, DRINK
    @Column(nullable = false)
    private String category;

    private String imageUrl;

    @Column(nullable = false)
    private boolean active = true;

    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "menuItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VariantGroup> variantGroups = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public BigDecimal getDiscountedPrice() { return discountedPrice; }
    public void setDiscountedPrice(BigDecimal discountedPrice) { this.discountedPrice = discountedPrice; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public List<VariantGroup> getVariantGroups() { return variantGroups; }
    public void setVariantGroups(List<VariantGroup> variantGroups) { this.variantGroups = variantGroups; }
}
