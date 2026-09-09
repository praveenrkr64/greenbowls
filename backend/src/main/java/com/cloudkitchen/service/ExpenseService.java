package com.cloudkitchen.service;

import com.cloudkitchen.dto.ExpenseDto;
import com.cloudkitchen.dto.ExpenseRequest;
import com.cloudkitchen.dto.ExpenseSummaryDto;
import com.cloudkitchen.entity.Expense;
import com.cloudkitchen.repository.ExpenseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    // Same kitchen-local reasoning as DeliverySlotService: "today's spend" means the
    // kitchen's today, not the server's UTC today.
    private static final ZoneId KITCHEN_ZONE = ZoneId.of("Asia/Kolkata");

    /** Enough to see where the money goes without turning the panel into a spreadsheet. */
    private static final int TOP_ITEMS = 10;

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    @Transactional
    public ExpenseDto create(ExpenseRequest request) {
        Expense expense = new Expense();
        apply(expense, request);
        return toDto(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseDto update(Long id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found"));
        apply(expense, request);
        return toDto(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found");
        }
        expenseRepository.deleteById(id);
    }

    /**
     * The spend report for a period. Both bounds are optional: with neither, everything ever
     * recorded is summarised, which is what an admin opening the tab for the first time wants
     * to see rather than an empty screen.
     */
    @Transactional(readOnly = true)
    public ExpenseSummaryDto summarise(LocalDate from, LocalDate to) {
        List<Expense> expenses = (from == null && to == null)
                ? expenseRepository.findAllByOrderBySpentOnDescIdDesc()
                : expenseRepository.findBySpentOnBetweenOrderBySpentOnDescIdDesc(
                        from != null ? from : LocalDate.of(1970, 1, 1),
                        to != null ? to : LocalDate.now(KITCHEN_ZONE));

        BigDecimal total = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ExpenseSummaryDto.CategoryTotal> byCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory() == null || e.getCategory().isBlank()
                                ? "Uncategorised" : e.getCategory(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)))
                .entrySet().stream()
                .map(e -> new ExpenseSummaryDto.CategoryTotal(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(ExpenseSummaryDto.CategoryTotal::total).reversed())
                .toList();

        // Grouped case-insensitively on a trimmed name: "Paneer", "paneer " and "PANEER" are the
        // same purchase to anyone reading the report, and splitting them would understate every
        // line. The first spelling seen is kept for display.
        Map<String, List<Expense>> byItem = expenses.stream()
                .collect(Collectors.groupingBy(e -> e.getItemName().trim().toLowerCase()));
        List<ExpenseSummaryDto.ItemTotal> topItems = byItem.values().stream()
                .map(group -> new ExpenseSummaryDto.ItemTotal(
                        group.get(0).getItemName().trim(),
                        group.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add),
                        group.size()))
                .sorted(Comparator.comparing(ExpenseSummaryDto.ItemTotal::total).reversed())
                .limit(TOP_ITEMS)
                .toList();

        return new ExpenseSummaryDto(from, to, total, byCategory, topItems,
                expenses.stream().map(this::toDto).toList());
    }

    private void apply(Expense expense, ExpenseRequest request) {
        expense.setItemName(request.getItemName().trim());
        expense.setCategory(blankToNull(request.getCategory()));
        expense.setQuantity(request.getQuantity());
        expense.setUnit(blankToNull(request.getUnit()));
        expense.setAmount(request.getAmount());
        // Defaulted rather than required: entering a stack of receipts should not mean retyping
        // the same date on each one.
        expense.setSpentOn(request.getSpentOn() != null
                ? request.getSpentOn() : LocalDate.now(KITCHEN_ZONE));
        expense.setVendor(blankToNull(request.getVendor()));
        expense.setNotes(blankToNull(request.getNotes()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ExpenseDto toDto(Expense e) {
        return new ExpenseDto(e.getId(), e.getItemName(), e.getCategory(), e.getQuantity(),
                e.getUnit(), e.getAmount(), e.getSpentOn(), e.getVendor(), e.getNotes());
    }
}
