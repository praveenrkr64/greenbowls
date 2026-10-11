package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// What the customer submits. No prices, no items - those are agreed on the call.
public class SubscriptionRequestCreate {

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name must be 120 characters or fewer")
    private String customerName;

    @NotBlank(message = "Phone number is required")
    // Digits, plus, spaces and hyphens. Hyphen last in the class so it needs no escaping.
    @Pattern(regexp = "^[0-9+ -]{7,20}$", message = "Enter a valid phone number")
    private String phone;

    @NotBlank(message = "Choose weekly or monthly")
    private String planType;

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }
}
