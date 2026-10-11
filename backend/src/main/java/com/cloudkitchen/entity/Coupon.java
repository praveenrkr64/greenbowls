package com.cloudkitchen.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One coupon, held by one phone number.
 *
 * <p>The rules are copied from the {@link CouponType} at issue time rather than read through the
 * relation. A coupon is a promise to a specific customer; if the kitchen later edits the type -
 * drops the discount, tightens the condition - the coupon already in someone's hands must keep
 * the terms it was issued under.
 */
@Entity
@Table(name = "coupons", indexes = {
        @Index(name = "idx_coupon_code", columnList = "code", unique = true),
        @Index(name = "idx_coupon_phone", columnList = "phone")
})
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** What the customer types at checkout. Uppercase, unique. */
    @Column(nullable = false, length = 32, unique = true)
    private String code;

    /**
     * The coupon belongs to this number - it cannot be used from any other. NULL for a master
     * coupon, which belongs to nobody and is applied by the kitchen to whichever order it likes.
     */
    @Column(length = 20)
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_type_id")
    private CouponType couponType;

    /** Label at issue time, so the admin list stays readable even if the type is renamed. */
    @Column(nullable = false, length = 120)
    private String name;

    // --- snapshot of the type's rules, see the class note ---

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CouponType.ConditionType conditionType = CouponType.ConditionType.NONE;

    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderTotal;

    @Column(length = 80)
    private String categoryName;

    private Integer minQuantity;

    @Column(nullable = false, updatable = false)
    private Instant issuedAt = Instant.now();

    @Column(nullable = false)
    private Instant expiresAt;

    /** Null until redeemed. Set together with usedOrderId, inside the order transaction. */
    private Instant usedAt;

    private Long usedOrderId;

    /** Master coupon: applies to any number of orders rather than being spent on the first. */
    @Column(nullable = false)
    private boolean reusable = false;

    /** Master coupon: refused at customer checkout, applied by the kitchen only. */
    @Column(nullable = false)
    private boolean adminOnly = false;

    /** How many orders it has been applied to. Informational for a reusable coupon. */
    @Column(nullable = false)
    private int timesUsed = 0;

    /** A reusable coupon is never "used up", however many orders it has been applied to. */
    public boolean isUsed() {
        return !reusable && usedAt != null;
    }

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public CouponType getCouponType() { return couponType; }
    public void setCouponType(CouponType couponType) { this.couponType = couponType; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public CouponType.ConditionType getConditionType() { return conditionType; }
    public void setConditionType(CouponType.ConditionType conditionType) { this.conditionType = conditionType; }

    public BigDecimal getMinOrderTotal() { return minOrderTotal; }
    public void setMinOrderTotal(BigDecimal minOrderTotal) { this.minOrderTotal = minOrderTotal; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public Integer getMinQuantity() { return minQuantity; }
    public void setMinQuantity(Integer minQuantity) { this.minQuantity = minQuantity; }

    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getUsedAt() { return usedAt; }
    public void setUsedAt(Instant usedAt) { this.usedAt = usedAt; }

    public Long getUsedOrderId() { return usedOrderId; }
    public void setUsedOrderId(Long usedOrderId) { this.usedOrderId = usedOrderId; }

    public boolean isReusable() { return reusable; }
    public void setReusable(boolean reusable) { this.reusable = reusable; }

    public boolean isAdminOnly() { return adminOnly; }
    public void setAdminOnly(boolean adminOnly) { this.adminOnly = adminOnly; }

    public int getTimesUsed() { return timesUsed; }
    public void setTimesUsed(int timesUsed) { this.timesUsed = timesUsed; }
}
