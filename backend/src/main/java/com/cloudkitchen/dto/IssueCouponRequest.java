package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

// Admin issuing a coupon by hand to one phone number.
public class IssueCouponRequest {

    @NotNull(message = "Choose a coupon type")
    private Long couponTypeId;

    /** Omitted for a master coupon, which belongs to nobody. Required for a customer coupon. */
    @Pattern(regexp = "^$|^[0-9+ -]{7,20}$", message = "Enter a valid phone number")
    private String phone;

    public Long getCouponTypeId() { return couponTypeId; }
    public void setCouponTypeId(Long couponTypeId) { this.couponTypeId = couponTypeId; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
