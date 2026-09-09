package com.cloudkitchen.controller;

import com.cloudkitchen.dto.CustomerProfileDto;
import com.cloudkitchen.dto.CustomerResponse;
import com.cloudkitchen.dto.OrderResponse;
import com.cloudkitchen.service.CustomerService;
import com.cloudkitchen.service.OrderService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// Admin-only: every customer we've ever taken an order from, one row per phone number.
@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final OrderService orderService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public CustomerController(CustomerService customerService, OrderService orderService) {
        this.customerService = customerService;
        this.orderService = orderService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @GetMapping
    public List<CustomerResponse> listCustomers(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return customerService.listCustomers();
    }

    // Used by the admin "search by phone" view - the 3 most recent orders for that number.
    @GetMapping("/{phone}/orders")
    public List<OrderResponse> recentOrders(@PathVariable String phone,
                                             @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return orderService.getRecentOrdersByPhone(phone);
    }

    // Public: checkout autofill for a returning customer, by their own phone number -
    // no login, no admin key. 404 just means this phone hasn't ordered before.
    @GetMapping("/{phone}/profile")
    public ResponseEntity<CustomerProfileDto> getProfile(@PathVariable String phone) {
        return orderService.getProfileByPhone(phone)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
