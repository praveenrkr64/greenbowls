package com.cloudkitchen.dto;

import java.math.BigDecimal;
import java.time.Instant;

// Admin view of an issued coupon.
public record CouponDto(
        Long id,
        String code,
        String phone,
        String name,
        BigDecimal discountAmount,
        String description,
        Instant issuedAt,
        Instant expiresAt,
        Instant usedAt,
        Long usedOrderId,
        boolean reusable,
        boolean adminOnly,
        int timesUsed,
        boolean expired) {
}
