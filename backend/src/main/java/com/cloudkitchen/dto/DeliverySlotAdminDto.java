package com.cloudkitchen.dto;

import java.time.LocalTime;

// The admin view: adds capacity, the live count for today, and the active flag.
public record DeliverySlotAdminDto(
        Long id,
        String label,
        LocalTime startTime,
        LocalTime endTime,
        Integer maxOrders,
        long ordersToday,
        boolean active,
        int sortOrder) {
}
