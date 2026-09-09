package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;

public class MarkDeliveredRequest {
    @NotBlank
    private String phone;

    @NotBlank
    private String secretKey;

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
}
