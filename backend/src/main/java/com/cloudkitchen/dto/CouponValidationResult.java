package com.cloudkitchen.dto;

import java.math.BigDecimal;

/**
 * Answer to "can this cart use this code?". Always 200 with valid=false rather than an error
 * status - a customer mistyping a code is a normal outcome, not an exceptional one, and the
 * checkout page needs the reason to show rather than a stack of HTTP cases to branch on.
 */
public record CouponValidationResult(
        boolean valid,
        String code,
        String name,
        String description,
        BigDecimal discountAmount,
        /** Why it cannot be used. Null when valid. */
        String reason) {

    public static CouponValidationResult rejected(String code, String reason) {
        return new CouponValidationResult(false, code, null, null, null, reason);
    }
}
