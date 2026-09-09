package com.cloudkitchen.dto;

import java.math.BigDecimal;
import java.util.List;

// Admin view of a menu item: includes inactive items/options and the active/sortOrder
// fields the public MenuItemDto omits, since the public /api/menu already filters those out.
public record MenuItemAdminDto(
        Long id,
        String name,
        String description,
        BigDecimal basePrice,
        BigDecimal discountedPrice,
        String category,
        String imageUrl,
        boolean active,
        int sortOrder,
        List<VariantGroupAdminDto> variantGroups
) {}
