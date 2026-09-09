package com.cloudkitchen.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String customerName,
        String customerPhone,
        String communityName,
        String communityColor,
        String tower,
        String flatNumber,
        String notes,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        String discountReason,
        BigDecimal totalAmount,
        String status,
        Instant createdAt,
        Long deliveryAgentId,
        String deliveryAgentName,
        String deliveryAgentPhone,
        String deliverySlotLabel,
        String deliverySlotWindow,
        boolean expressDelivery,
        List<OrderItemResponse> items
) {
    public record OrderItemResponse(
            String menuItemName,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal,
            List<String> selections
    ) {}
}
