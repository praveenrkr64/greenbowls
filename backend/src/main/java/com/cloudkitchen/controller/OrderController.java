package com.cloudkitchen.controller;

import com.cloudkitchen.dto.AssignDeliveryAgentRequest;
import com.cloudkitchen.dto.CancelOrderRequest;
import com.cloudkitchen.dto.CreateOrderRequest;
import com.cloudkitchen.dto.MarkDeliveredRequest;
import com.cloudkitchen.dto.OrderResponse;
import com.cloudkitchen.dto.PageResponse;
import com.cloudkitchen.dto.UpdateOrderStatusRequest;
import com.cloudkitchen.entity.OrderStatus;
import com.cloudkitchen.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    // Shared secret the admin frontend sends as X-Admin-Key. Set ADMIN_API_KEY
    // in your deployment env. Endpoints that expose all customers' orders, or
    // let anyone change an order's status, require this - creating an order
    // and looking up a single order by its own id (for the confirmation page)
    // do not, since customers need those without logging in.
    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrder(request);
    }

    // Admin-facing: paginated order list (default page size 20), most recent first
    // unless sortBy=community. filter is "ALL", "ACTIVE", or a single status name.
    @GetMapping
    public PageResponse<OrderResponse> listOrders(
            @RequestParam(defaultValue = "ALL") String filter,
            @RequestParam(defaultValue = "newest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return orderService.listOrders(filter, sortBy, page, size);
    }

    // Used by the order confirmation page - a customer looking up their own
    // order by the id they were just given. No admin key required.
    @GetMapping("/{id}")
    public OrderResponse getOrder(@PathVariable Long id) {
        return orderService.getOrder(id);
    }

    // Public: a customer looking up their own last 3 orders by their own phone
    // number - the same lookup the admin customer view uses, without the admin gate.
    @GetMapping("/recent")
    public List<OrderResponse> getRecentOrdersForCustomer(@RequestParam String phone) {
        return orderService.getRecentOrdersByPhone(phone);
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateOrderStatusRequest request,
                                       @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        OrderStatus status = OrderStatus.valueOf(request.getStatus().toUpperCase());
        return orderService.updateStatus(id, status);
    }

    // Public: a customer cancelling their own order, verified by phone number -
    // see OrderService.cancelOrder for why phone match + NEW/CONFIRMED-only apply.
    @PatchMapping("/{id}/cancel")
    public OrderResponse cancelOrder(@PathVariable Long id, @Valid @RequestBody CancelOrderRequest request) {
        return orderService.cancelOrder(id, request.getPhone());
    }

    // Admin-facing: assign (or unassign, with a null agentId) a delivery agent to this order.
    /** Admin applies a (normally reusable, admin-only) coupon to an existing order. */
    @PatchMapping("/{id}/apply-coupon")
    public OrderResponse applyCoupon(@PathVariable Long id, @RequestBody Map<String, String> body,
                                      @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return orderService.applyCouponAsAdmin(id, body.get("code"));
    }

    @PatchMapping("/{id}/assign-agent")
    public OrderResponse assignAgent(@PathVariable Long id, @RequestBody AssignDeliveryAgentRequest request,
                                      @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        requireAdmin(adminKey);
        return orderService.assignAgent(id, request.getAgentId());
    }

    // Public: a delivery agent looking up their own assigned, still-undelivered orders
    // by their own phone number + secret key - see OrderService.getOrdersForAgent.
    @GetMapping("/assigned")
    public List<OrderResponse> getAssignedOrders(@RequestParam String phone, @RequestParam String key) {
        return orderService.getOrdersForAgent(phone, key);
    }

    // Public: a delivery agent marking their own assigned order delivered, verified by
    // their own phone number + secret key - see OrderService.markDelivered.
    @PatchMapping("/{id}/deliver")
    public OrderResponse markDelivered(@PathVariable Long id, @Valid @RequestBody MarkDeliveredRequest request) {
        return orderService.markDelivered(id, request.getPhone(), request.getSecretKey());
    }
}
