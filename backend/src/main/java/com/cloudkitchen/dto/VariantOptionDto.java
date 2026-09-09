package com.cloudkitchen.dto;

import java.math.BigDecimal;

public record VariantOptionDto(
        Long id,
        String name,
        BigDecimal priceDelta
) {}
