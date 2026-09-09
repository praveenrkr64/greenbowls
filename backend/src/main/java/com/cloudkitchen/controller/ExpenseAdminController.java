package com.cloudkitchen.controller;

import com.cloudkitchen.dto.ExpenseDto;
import com.cloudkitchen.dto.ExpenseRequest;
import com.cloudkitchen.dto.ExpenseSummaryDto;
import com.cloudkitchen.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

// Admin-only, with no public counterpart: what the kitchen spends is not customer-facing
// information, so unlike menu or categories there is no read-only public endpoint here.
@RestController
@RequestMapping("/api/admin/expenses")
public class ExpenseAdminController {

    private final ExpenseService expenseService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public ExpenseAdminController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @GetMapping
    public ExpenseSummaryDto summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return expenseService.summarise(from, to);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseDto create(@Valid @RequestBody ExpenseRequest request,
                             @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return expenseService.create(request);
    }

    @PutMapping("/{id}")
    public ExpenseDto update(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request,
                             @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return expenseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,
                       @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        expenseService.delete(id);
    }
}
