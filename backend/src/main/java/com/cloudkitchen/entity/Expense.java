package com.cloudkitchen.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

// A single thing the kitchen bought: 5kg moong, a gas cylinder, packaging.
//
// Deliberately NOT linked to MenuItem. What gets bought (raw sprouts, oil, containers)
// and what gets sold (a finished bowl) are different things, and forcing a foreign key
// between them would mean inventing a menu item for every gas refill. `itemName` is free
// text, with `category` for grouping - which is what a spend report actually needs.
//
// This tracks COST ONLY. There is no stock count here: nothing decrements when an order
// is placed, and this entity makes no claim about what is in the kitchen right now.
@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String itemName;

    // Free-text grouping ("Vegetables", "Packaging", "Gas") rather than an enum, so the
    // admin can add a category without a code change.
    @Column(length = 100)
    private String category;

    // Nullable: "2 crates" is sometimes all that is known, and a spend ledger should not
    // reject a real receipt for want of a tidy number.
    @Column(precision = 10, scale = 3)
    private BigDecimal quantity;

    @Column(length = 40)
    private String unit;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    // The date the money was spent, which is not necessarily when the row was entered --
    // receipts get typed up later. Reports group on this, not on createdAt.
    @Column(nullable = false)
    private LocalDate spentOn;

    @Column(length = 200)
    private String vendor;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
