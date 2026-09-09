package com.cloudkitchen.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// The spend report: the rows for the chosen period plus the totals the admin actually
// looks at. Totals are computed server-side so the admin panel and any later report agree
// on the arithmetic rather than each rounding their own way.
public record ExpenseSummaryDto(
        LocalDate from,
        LocalDate to,
        BigDecimal totalSpend,
        List<CategoryTotal> byCategory,
        List<ItemTotal> topItems,
        List<ExpenseDto> expenses) {

    public record CategoryTotal(String category, BigDecimal total) {}

    // Same item bought repeatedly, added up -- "how much have I spent on paneer this month"
    // is the question this answers.
    public record ItemTotal(String itemName, BigDecimal total, long purchases) {}
}
