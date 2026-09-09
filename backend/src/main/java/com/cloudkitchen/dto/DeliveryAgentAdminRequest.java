package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Used for both create and update.
public class DeliveryAgentAdminRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    // The agent enters this alongside their phone number to see/manage their orders.
    @NotBlank
    @Size(min = 4, max = 30, message = "Secret key must be between 4 and 30 characters")
    private String secretKey;

    private boolean active = true;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
