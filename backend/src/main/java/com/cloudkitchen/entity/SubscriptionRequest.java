package com.cloudkitchen.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * A customer asking to be called back about a weekly or monthly plan.
 *
 * <p>Deliberately NOT an order and NOT a subscription. Nothing is priced, scheduled or charged
 * here: the customer picks a cadence, leaves a number, and the kitchen rings them to agree which
 * bowls, what times and what price. Modelling a real subscription (plan items, billing dates,
 * renewals) before any of that is known would be inventing requirements.
 */
@Entity
@Table(name = "subscription_requests")
public class SubscriptionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String customerName;

    @Column(nullable = false, length = 20)
    private String phone;

    /** WEEKLY or MONTHLY. Stored as text so adding a cadence later needs no migration. */
    @Column(nullable = false, length = 20)
    private String planType;

    /** NEW -> CONTACTED -> CLOSED. The kitchen's own worklist state. */
    @Column(nullable = false, length = 20)
    private String status = "NEW";

    /** What was agreed on the call - bowls, timings, price. Filled in by the admin afterwards. */
    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
