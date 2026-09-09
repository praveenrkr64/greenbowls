package com.cloudkitchen.dto;

import java.util.List;

public record VariantGroupAdminDto(
        Long id,
        String name,
        boolean required,
        int minSelect,
        int maxSelect,
        int sortOrder,
        List<VariantOptionAdminDto> options
) {}
