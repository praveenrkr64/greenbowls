package com.cloudkitchen.entity;

import jakarta.persistence.*;

import java.time.LocalTime;

// A delivery time window a customer can pick at checkout, e.g. 12:00-13:00.
//
// maxOrders caps how many orders may choose the same window on the same day, so a
// popular slot stops being offered once the kitchen is full rather than being oversold.
// Capacity is counted against orders placed today (see DeliverySlotService), not against
// a stored counter -- a counter would drift whenever an order is cancelled or deleted.
//
// Express ("20 minute") delivery is deliberately NOT a slot. It is a flag on
// RestaurantSettings, and an express order carries no slot at all: the whole point is
// that it skips the schedule.
@Entity
@Table(name = "delivery_slots")
public class DeliverySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Shown to the customer, e.g. "Lunch". The times are rendered alongside it, so this
    // is a name rather than a description of the window.
    @Column(nullable = false, length = 80)
    private String label;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    // 0 or null means unlimited -- an admin who does not care about capacity should not
    // have to invent a number.
    private Integer maxOrders;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int sortOrder = 0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public Integer getMaxOrders() { return maxOrders; }
    public void setMaxOrders(Integer maxOrders) { this.maxOrders = maxOrders; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public boolean isUnlimited() {
        return maxOrders == null || maxOrders <= 0;
    }
}
