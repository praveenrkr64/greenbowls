package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// Mirrors the shape the browser's PushSubscription.toJSON() produces, so the frontend can
// forward it with no reshaping.
public class PushSubscriptionRequest {

    @NotNull(message = "Order id is required")
    private Long orderId;

    @NotBlank(message = "Endpoint is required")
    private String endpoint;

    @NotBlank(message = "p256dh key is required")
    private String p256dh;

    @NotBlank(message = "auth key is required")
    private String auth;

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getP256dh() { return p256dh; }
    public void setP256dh(String p256dh) { this.p256dh = p256dh; }

    public String getAuth() { return auth; }
    public void setAuth(String auth) { this.auth = auth; }
}
