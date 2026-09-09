package com.cloudkitchen.controller;

import com.cloudkitchen.dto.PushSubscriptionRequest;
import com.cloudkitchen.service.PushNotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// Public, like the rest of the customer-facing order endpoints. A subscription is only useful
// to whoever holds the order id, and the push it enables says nothing an order-page visitor
// cannot already see.
@RestController
@RequestMapping("/api/push")
public class PushController {

    private final PushNotificationService pushNotificationService;

    public PushController(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    /**
     * The VAPID public key the browser needs to create a subscription, plus whether push is
     * configured at all. The frontend asks first so it can skip the permission prompt entirely
     * on a deployment with no keys, rather than asking and then failing.
     */
    @GetMapping("/config")
    public Map<String, Object> config() {
        return Map.of(
                "enabled", pushNotificationService.isEnabled(),
                "publicKey", pushNotificationService.getPublicKey());
    }

    @PostMapping("/subscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(@Valid @RequestBody PushSubscriptionRequest request) {
        pushNotificationService.subscribe(request);
    }
}
