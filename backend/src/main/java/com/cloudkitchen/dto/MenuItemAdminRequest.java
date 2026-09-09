package com.cloudkitchen.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

// Used for both create and update - the whole nested variantGroups/options tree is
// replaced wholesale on every save, matching how DataSeeder builds it and how the
// entities are wired (cascade=ALL, orphanRemoval=true).
public class MenuItemAdminRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    @PositiveOrZero
    private BigDecimal basePrice;

    // Optional - when set, this is what's charged instead of basePrice, and basePrice is
    // shown struck through next to it. Must be positive and less than basePrice (validated
    // in MenuService, since that check needs both fields together).
    private BigDecimal discountedPrice;

    @NotBlank
    private String category;

    private String imageUrl;

    private boolean active = true;

    private int sortOrder = 0;

    @Valid
    private List<VariantGroupRequest> variantGroups = List.of();

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

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public List<VariantGroupRequest> getVariantGroups() { return variantGroups; }
    public void setVariantGroups(List<VariantGroupRequest> variantGroups) { this.variantGroups = variantGroups; }

    public static class VariantGroupRequest {
        @NotBlank
        private String name;

        private boolean required = false;

        @PositiveOrZero
        private int minSelect = 0;

        @PositiveOrZero
        private int maxSelect = 1;

        private int sortOrder = 0;

        @NotEmpty
        @Valid
        private List<VariantOptionRequest> options = List.of();

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public boolean isRequired() { return required; }
        public void setRequired(boolean required) { this.required = required; }

        public int getMinSelect() { return minSelect; }
        public void setMinSelect(int minSelect) { this.minSelect = minSelect; }

        public int getMaxSelect() { return maxSelect; }
        public void setMaxSelect(int maxSelect) { this.maxSelect = maxSelect; }

        public int getSortOrder() { return sortOrder; }
        public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

        public List<VariantOptionRequest> getOptions() { return options; }
        public void setOptions(List<VariantOptionRequest> options) { this.options = options; }
    }

    public static class VariantOptionRequest {
        @NotBlank
        private String name;

        @NotNull
        private BigDecimal priceDelta = BigDecimal.ZERO;

        private boolean active = true;

        private int sortOrder = 0;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public BigDecimal getPriceDelta() { return priceDelta; }
        public void setPriceDelta(BigDecimal priceDelta) { this.priceDelta = priceDelta; }

        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }

        public int getSortOrder() { return sortOrder; }
        public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    }
}
