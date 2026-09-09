package com.cloudkitchen.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerPhone;

    // Nullable: existing orders placed before this relation existed are backfilled
    // asynchronously at startup rather than requiring a hard NOT NULL migration -
    // see CustomerBackfillRunner.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id", nullable = false)
    private ApartmentCommunity community;

    // Nullable - unassigned until the admin picks a delivery agent for this order.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_agent_id")
    private DeliveryAgent deliveryAgent;

    // Optional: an express order has no slot, and orders placed before slots existed have
    // none either. Kept nullable so removing a slot cannot orphan or delete past orders.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_slot_id")
    private DeliverySlot deliverySlot;

    // Express ("20 minute") delivery, chosen instead of a slot rather than alongside one.
    //
    // columnDefinition carries the DEFAULT, and it is load-bearing rather than decoration.
    // ddl-auto=update generates a plain "add column express_delivery boolean not null" without
    // it, which Postgres rejects on any table that already has rows -- there is nothing to put
    // in the column for existing orders. The Java initialiser above does not help: it applies
    // to new objects, never to an ALTER. Hibernate logs that failure as a WARNING and carries
    // on, so the app starts with the column silently missing and every order query then fails.
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean expressDelivery = false;

    // e.g. tower / block name
    @Column(nullable = false)
    private String tower;

    @Column(nullable = false)
    private String flatNumber;

    private String notes;

    // The final, actually-payable amount - after any order-level discount (e.g. the
    // first-order welcome offer). This is what the kitchen collects on delivery.
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    // Sum of line totals before any order-level discount. Nullable in the DB - orders
    // placed before this column existed predate the concept, so they fall back to
    // totalAmount (i.e. "no discount") in OrderService.toResponse rather than being backfilled.
    @Column(precision = 10, scale = 2)
    private BigDecimal subtotalAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal discountAmount;

    // e.g. "Welcome offer - 50% off your first order (up to Rs 100)" - null when no
    // order-level discount applied.
    private String discountReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.NEW;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public ApartmentCommunity getCommunity() { return community; }
    public void setCommunity(ApartmentCommunity community) { this.community = community; }

    public DeliveryAgent getDeliveryAgent() { return deliveryAgent; }
    public void setDeliveryAgent(DeliveryAgent deliveryAgent) { this.deliveryAgent = deliveryAgent; }

    public String getTower() { return tower; }
    public void setTower(String tower) { this.tower = tower; }

    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getSubtotalAmount() { return subtotalAmount; }
    public void setSubtotalAmount(BigDecimal subtotalAmount) { this.subtotalAmount = subtotalAmount; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public String getDiscountReason() { return discountReason; }
    public void setDiscountReason(String discountReason) { this.discountReason = discountReason; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public DeliverySlot getDeliverySlot() { return deliverySlot; }
    public void setDeliverySlot(DeliverySlot deliverySlot) { this.deliverySlot = deliverySlot; }

    public boolean isExpressDelivery() { return expressDelivery; }
    public void setExpressDelivery(boolean expressDelivery) { this.expressDelivery = expressDelivery; }
}
