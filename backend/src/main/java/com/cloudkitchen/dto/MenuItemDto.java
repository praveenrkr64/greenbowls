package com.cloudkitchen.dto;

import java.math.BigDecimal;
import java.util.List;

public record MenuItemDto(
        Long id,
        String name,
        String description,
        BigDecimal basePrice,
        BigDecimal discountedPrice,
        String category,
        String imageUrl,
        List<VariantGroupDto> variantGroups
) {}
