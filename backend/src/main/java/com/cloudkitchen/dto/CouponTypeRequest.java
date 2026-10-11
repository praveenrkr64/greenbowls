package com.cloudkitchen.dto;

import com.cloudkitchen.entity.CouponType.ConditionType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class CouponTypeRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name must be 120 characters or fewer")
    private String name;

    @NotNull(message = "Discount amount is required")
    @DecimalMin(value = "1.0", message = "Discount must be at least 1")
    private BigDecimal discountAmount;

    @NotNull(message = "Condition type is required")
    private ConditionType conditionType;

    @DecimalMin(value = "0.0", message = "Minimum bill cannot be negative")
    private BigDecimal minOrderTotal;

    @Size(max = 80, message = "Category must be 80 characters or fewer")
    private String categoryName;

    @Min(value = 1, message = "Minimum quantity must be at least 1")
    private Integer minQuantity;

    @Min(value = 1, message = "Validity must be at least 1 day")
    @Max(value = 3650, message = "Validity must be 3650 days or fewer")
    private int validityDays = 30;

    private boolean autoIssueOnDelivery = false;

    /** Master coupon: applies to any number of orders. Implies adminOnly. */
    private boolean reusable = false;

    /** Only the kitchen can apply it, from the order screen. */
    private boolean adminOnly = false;

    private Boolean active;

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

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
