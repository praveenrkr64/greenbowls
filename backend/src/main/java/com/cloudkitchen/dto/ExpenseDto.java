package com.cloudkitchen.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseDto(
        Long id,
        String itemName,
        String category,
        BigDecimal quantity,
        String unit,
        BigDecimal amount,
        LocalDate spentOn,
        String vendor,
        String notes) {
}
