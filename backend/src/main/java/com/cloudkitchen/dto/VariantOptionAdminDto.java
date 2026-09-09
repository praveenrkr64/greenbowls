package com.cloudkitchen.dto;

import java.math.BigDecimal;

public record VariantOptionAdminDto(
        Long id,
        String name,
        BigDecimal priceDelta,
        boolean active,
        int sortOrder
) {}
