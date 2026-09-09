package com.cloudkitchen.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseRequest {

    @NotBlank(message = "Item name is required")
    @Size(max = 200, message = "Item name must be 200 characters or fewer")
    private String itemName;

    @Size(max = 100, message = "Category must be 100 characters or fewer")
    private String category;

    private BigDecimal quantity;

    @Size(max = 40)
    private String unit;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than zero")
    private BigDecimal amount;

    // Optional on the way in: an admin entering today's receipts should not have to retype
    // today's date every time. The service defaults it.
    private LocalDate spentOn;

    @Size(max = 200)
    private String vendor;

    @Size(max = 500)
    private String notes;

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDate getSpentOn() { return spentOn; }
    public void setSpentOn(LocalDate spentOn) { this.spentOn = spentOn; }

    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
