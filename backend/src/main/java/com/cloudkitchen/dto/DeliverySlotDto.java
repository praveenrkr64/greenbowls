package com.cloudkitchen.dto;

import java.time.LocalTime;

// What the CUSTOMER sees at checkout. Carries `available` and `soldOut` rather than a raw
// order count: how full a slot is, is the kitchen's business, not the customer's.
public record DeliverySlotDto(
        Long id,
        String label,
        LocalTime startTime,
        LocalTime endTime,
        boolean available,
        boolean soldOut,
        String unavailableReason) {
}
