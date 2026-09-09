package com.cloudkitchen.repository;

import com.cloudkitchen.entity.Order;
import com.cloudkitchen.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Capacity is counted live rather than kept as a column on the slot. A stored counter
    // drifts the moment an order is cancelled or deleted, and the drift is silent -- a slot
    // reads as full while the kitchen is idle. Counting rows is cheap at this order volume
    // and cannot go stale.
    long countByDeliverySlotIdAndCreatedAtBetweenAndStatusNot(
            Long deliverySlotId, Instant from, Instant to, OrderStatus excludedStatus);

    // findById(Long) and findAll(Pageable) are inherited from JpaRepository
    List<Order> findAllByOrderByCreatedAtDesc();
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
    // Orders placed before the Customer relation existed - see CustomerBackfillRunner.
    List<Order> findByCustomerIsNull();
    List<Order> findTop3ByCustomer_PhoneOrderByCreatedAtDesc(String phone);
    // Delivery-agent self-service lookup by their own phone number - only orders still
    // needing action (not yet delivered or cancelled).
    List<Order> findByDeliveryAgent_PhoneAndStatusNotInOrderByCreatedAtDesc(String phone, List<OrderStatus> excludedStatuses);
    // Checkout autofill: this customer's most recent delivery address, if any.
    Optional<Order> findFirstByCustomer_PhoneOrderByCreatedAtDesc(String phone);

    // Paginated admin order list - sort/direction comes from the Pageable itself
    // (see OrderService.listOrders), so no "OrderBy..." suffix is needed here.
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    Page<Order> findByStatusNotIn(List<OrderStatus> statuses, Pageable pageable);
}
