package com.cloudkitchen.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * A kind of coupon the kitchen offers - the template, not a coupon anyone holds.
 *
 * <p>Issuing one mints a {@link Coupon} with its own code against a phone number. The rules are
 * SNAPSHOT onto that coupon at issue time, so editing a type later never silently changes what a
 * customer was already promised.
 */
@Entity
@Table(name = "coupon_types")
public class CouponType {

    /** How a coupon decides whether the cart qualifies. */
    public enum ConditionType {
        /** No condition - any order qualifies. */
        NONE,
        /** Cart subtotal must be at least minOrderTotal, e.g. "bill of 500 or more". */
        MIN_ORDER_TOTAL,
        /** At least minQuantity items from categoryName, e.g. "buy 2 salads". */
        MIN_CATEGORY_QUANTITY
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Shown to the admin and to the customer when the coupon applies. */
    @Column(nullable = false, length = 120)
    private String name;

    /** Flat amount off, in rupees. Percentage discounts are deliberately not modelled yet. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ConditionType conditionType = ConditionType.NONE;

    /** Used when conditionType is MIN_ORDER_TOTAL. */
    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderTotal;

    /** Used when conditionType is MIN_CATEGORY_QUANTITY - matches MenuItem.category. */
    @Column(length = 80)
    private String categoryName;

    /** Used when conditionType is MIN_CATEGORY_QUANTITY. */
    private Integer minQuantity;

    /** Days a freshly issued coupon stays usable. */
    @Column(nullable = false)
    private int validityDays = 30;

    /**
     * Mint one of these automatically when an order is DELIVERED. Delivery rather than placement,
     * so a placed-then-cancelled order cannot be used to farm coupons.
     */
    @Column(nullable = false)
    private boolean autoIssueOnDelivery = false;

    /**
     * A master coupon: usable on any number of orders instead of being spent on the first.
     * Not tied to a phone number either - see Coupon.phone.
     */
    @Column(nullable = false)
    private boolean reusable = false;

    /**
     * Only the kitchen can apply it, from the order screen. Entering it at customer checkout is
     * refused. A reusable code that a customer could type would be a discount on every order
     * the moment it leaked.
     */
    @Column(nullable = false)
    private boolean adminOnly = false;

    @Column(nullable = false)
    private boolean active = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public ConditionType getConditionType() { return conditionType; }
    public void setConditionType(ConditionType conditionType) { this.conditionType = conditionType; }

    public BigDecimal getMinOrderTotal() { return minOrderTotal; }
    public void setMinOrderTotal(BigDecimal minOrderTotal) { this.minOrderTotal = minOrderTotal; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public Integer getMinQuantity() { return minQuantity; }
    public void setMinQuantity(Integer minQuantity) { this.minQuantity = minQuantity; }

    public int getValidityDays() { return validityDays; }
    public void setValidityDays(int validityDays) { this.validityDays = validityDays; }

    public boolean isAutoIssueOnDelivery() { return autoIssueOnDelivery; }
    public void setAutoIssueOnDelivery(boolean autoIssueOnDelivery) { this.autoIssueOnDelivery = autoIssueOnDelivery; }

    public boolean isReusable() { return reusable; }
    public void setReusable(boolean reusable) { this.reusable = reusable; }

    public boolean isAdminOnly() { return adminOnly; }
    public void setAdminOnly(boolean adminOnly) { this.adminOnly = adminOnly; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
