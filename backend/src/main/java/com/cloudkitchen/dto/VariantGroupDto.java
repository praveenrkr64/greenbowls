package com.cloudkitchen.dto;

import java.util.List;

public record VariantGroupDto(
        Long id,
        String name,
        boolean required,
        int minSelect,
        int maxSelect,
        List<VariantOptionDto> options
) {}
