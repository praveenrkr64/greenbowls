package com.cloudkitchen.dto;

import java.time.Instant;

// Admin view of a call-back request.
public record SubscriptionRequestDto(
        Long id,
        String customerName,
        String phone,
        String planType,
        String status,
        String notes,
        Instant createdAt) {
}
