package com.cloudkitchen.dto;

import com.cloudkitchen.entity.CouponType.ConditionType;
import java.math.BigDecimal;

public record CouponTypeDto(
        Long id,
        String name,
        BigDecimal discountAmount,
        ConditionType conditionType,
        BigDecimal minOrderTotal,
        String categoryName,
        Integer minQuantity,
        int validityDays,
        boolean autoIssueOnDelivery,
        boolean reusable,
        boolean adminOnly,
        boolean active,
        /** Human-readable rule, e.g. "Rs 50 off when you buy 2 or more from Sprouts Salad". */
        String description) {
}
