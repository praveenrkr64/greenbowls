package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;

public class CancelOrderRequest {
    @NotBlank
    private String phone;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
