package com.cloudkitchen.service;

import com.cloudkitchen.dto.CreateOrderRequest;
import com.cloudkitchen.dto.CustomerProfileDto;
import com.cloudkitchen.dto.OrderResponse;
import com.cloudkitchen.dto.PageResponse;
import com.cloudkitchen.entity.*;
import com.cloudkitchen.repository.ApartmentCommunityRepository;
import com.cloudkitchen.repository.DeliveryAgentRepository;
import com.cloudkitchen.repository.MenuItemRepository;
import com.cloudkitchen.repository.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OrderService {

    // Welcome offer: a customer's very first order (by phone number, across the app's
    // whole history) gets half off, capped so a huge first order doesn't give away too much.
    private static final BigDecimal FIRST_ORDER_DISCOUNT_RATE = new BigDecimal("0.5");
    private static final BigDecimal FIRST_ORDER_DISCOUNT_CAP = new BigDecimal("100");

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final ApartmentCommunityRepository communityRepository;
    private final DeliveryAgentRepository deliveryAgentRepository;
    private final CustomerService customerService;
    private final EmailNotificationService emailNotificationService;
    private final DeliverySlotService deliverySlotService;
    private final RestaurantSettingsService restaurantSettingsService;
    private final PushNotificationService pushNotificationService;

    public OrderService(OrderRepository orderRepository, MenuItemRepository menuItemRepository,
                         ApartmentCommunityRepository communityRepository, DeliveryAgentRepository deliveryAgentRepository,
                         CustomerService customerService, EmailNotificationService emailNotificationService,
                         DeliverySlotService deliverySlotService,
                         RestaurantSettingsService restaurantSettingsService,
                         PushNotificationService pushNotificationService) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.communityRepository = communityRepository;
        this.deliveryAgentRepository = deliveryAgentRepository;
        this.customerService = customerService;
        this.emailNotificationService = emailNotificationService;
        this.deliverySlotService = deliverySlotService;
        this.restaurantSettingsService = restaurantSettingsService;
        this.pushNotificationService = pushNotificationService;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        ApartmentCommunity community = communityRepository.findById(request.getCommunityId())
                .filter(ApartmentCommunity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("We don't deliver to that community yet"));
        // Must be checked before findOrCreate() below, since that call's whole point is to
        // make this phone number exist as a Customer afterward.
        boolean isFirstOrder = customerService.isNewPhone(request.getCustomerPhone());
        Customer customer = customerService.findOrCreate(request.getCustomerName(), request.getCustomerPhone());

        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setCustomer(customer);
        order.setCommunity(community);
        order.setTower(request.getTower());
        order.setFlatNumber(request.getFlatNumber());
        order.setNotes(request.getNotes());
        order.setStatus(OrderStatus.NEW);
        applyDeliveryChoice(order, request);

        BigDecimal orderTotal = BigDecimal.ZERO;

        for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .filter(MenuItem::isActive)
                    .orElseThrow(() -> new IllegalArgumentException("Menu item unavailable: " + itemReq.getMenuItemId()));

            Set<Long> selectedIds = itemReq.getSelectedOptionIds() == null
                    ? new HashSet<>() : new HashSet<>(itemReq.getSelectedOptionIds());

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setMenuItemName(menuItem.getName());
            orderItem.setQuantity(Math.max(1, itemReq.getQuantity()));

            // The item's own discounted price (if the admin set one) always wins over
            // basePrice - this is a per-item promotion, separate from the first-order offer.
            BigDecimal unitPrice = menuItem.getDiscountedPrice() != null ? menuItem.getDiscountedPrice() : menuItem.getBasePrice();

            for (VariantGroup group : menuItem.getVariantGroups()) {
                List<VariantOption> chosen = group.getOptions().stream()
                        .filter(o -> o.isActive() && selectedIds.contains(o.getId()))
                        .collect(Collectors.toList());

                // effectiveMinSelect, not getMinSelect: a group flagged required with minSelect 0
                // must still demand a choice. Validating on the raw column let orders through with
                // nothing selected for a mandatory group.
                int minRequired = group.effectiveMinSelect();
                if (chosen.size() < minRequired || chosen.size() > group.getMaxSelect()) {
                    throw new IllegalArgumentException(
                            "\"" + group.getName() + "\" needs between " + minRequired
                                    + " and " + group.getMaxSelect() + " choice(s) for " + menuItem.getName());
                }

                for (VariantOption option : chosen) {
                    OrderItemSelection selection = new OrderItemSelection();
                    selection.setOrderItem(orderItem);
                    selection.setVariantGroupName(group.getName());
                    selection.setOptionName(option.getName());
                    selection.setPriceDelta(option.getPriceDelta());
                    orderItem.getSelections().add(selection);
                    unitPrice = unitPrice.add(option.getPriceDelta());
                }
            }

            orderItem.setUnitPrice(unitPrice);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(orderItem.getQuantity()));
            orderItem.setLineTotal(lineTotal);
            orderTotal = orderTotal.add(lineTotal);

            order.getItems().add(orderItem);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        String discountReason = null;
        if (isFirstOrder) {
            discountAmount = orderTotal.multiply(FIRST_ORDER_DISCOUNT_RATE)
                    .min(FIRST_ORDER_DISCOUNT_CAP)
                    .setScale(2, RoundingMode.HALF_UP);
            if (discountAmount.compareTo(BigDecimal.ZERO) > 0) {
                discountReason = "Welcome offer - 50% off your first order (up to Rs 100)";
            }
        }

        order.setSubtotalAmount(orderTotal);
        order.setDiscountAmount(discountAmount);
        order.setDiscountReason(discountReason);
        order.setTotalAmount(orderTotal.subtract(discountAmount));
        Order saved = orderRepository.save(order);
        OrderResponse response = toResponse(saved);
        emailNotificationService.notifyNewOrder(response);
        return response;
    }

    // Admin order list, paginated (default page size 20). filter is "ALL", "ACTIVE"
    // (everything but DELIVERED/CANCELLED), or a single OrderStatus name; sortBy is
    // "newest" (createdAt desc) or "community" (community name asc, then createdAt desc).
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> listOrders(String filter, String sortBy, int page, int size) {
        Sort sort = "community".equals(sortBy)
                ? Sort.by(Sort.Order.asc("community.name"), Sort.Order.desc("createdAt"))
                : Sort.by(Sort.Order.desc("createdAt"));
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), sort);

        Page<Order> result;
        if ("ACTIVE".equals(filter)) {
            result = orderRepository.findByStatusNotIn(List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED), pageable);
        } else if (filter != null && !filter.isBlank() && !"ALL".equals(filter)) {
            result = orderRepository.findByStatus(OrderStatus.valueOf(filter.toUpperCase()), pageable);
        } else {
            result = orderRepository.findAll(pageable);
        }

        return new PageResponse<>(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages()
        );
    }

    // Admin customer lookup: the 3 most recent orders for a given phone number.
    @Transactional(readOnly = true)
    public List<OrderResponse> getRecentOrdersByPhone(String phone) {
        return orderRepository.findTop3ByCustomer_PhoneOrderByCreatedAtDesc(phone).stream().map(this::toResponse).toList();
    }

    // Checkout autofill for a returning customer, keyed only by phone (no login) -
    // used when the browser has no locally-saved details (new device, cleared storage).
    @Transactional(readOnly = true)
    public Optional<CustomerProfileDto> getProfileByPhone(String phone) {
        return orderRepository.findFirstByCustomer_PhoneOrderByCreatedAtDesc(phone)
                .map(o -> new CustomerProfileDto(
                        o.getCustomerName(), o.getCustomerPhone(),
                        o.getCommunity().getId(), o.getCommunity().getName(),
                        o.getTower(), o.getFlatNumber()
                ));
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        return toResponse(order);
    }

    // The single chokepoint every order status change routes through (admin updates,
    // customer cancellation, delivery-agent mark-delivered) - this is where the
    // admin "order delivered" email hooks in (and where a future WhatsApp
    // status-change notification would too).
    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        OrderStatus previous = order.getStatus();
        order.setStatus(status);
        OrderResponse response = toResponse(orderRepository.save(order));
        if (status == OrderStatus.DELIVERED) {
            emailNotificationService.notifyOrderDelivered(response);
        }
        // Only on the TRANSITION into out-for-delivery, not on every save while already in it.
        // An admin who re-selects the same status, or edits the order afterwards, must not
        // buzz the customer a second time -- PushNotificationService also guards this, but not
        // re-entering here keeps the intent obvious.
        if (status == OrderStatus.OUT_FOR_DELIVERY && previous != OrderStatus.OUT_FOR_DELIVERY) {
            pushNotificationService.notifyOutForDelivery(order, restaurantSettingsService.getRestaurantName());
        }
        return response;
    }

    // Customer self-service: cancelling requires the phone the order was placed under
    // (the closest thing this app has to an auth check, since there's no login), and
    // only while it's still NEW/CONFIRMED - once the kitchen has started PREPARING,
    // the food is already committed and a customer can no longer back out.
    @Transactional
    public OrderResponse cancelOrder(Long orderId, String phone) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        if (!order.getCustomerPhone().equals(phone)) {
            throw new IllegalArgumentException("That phone number doesn't match this order");
        }
        if (order.getStatus() != OrderStatus.NEW && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalArgumentException("This order has already started preparing and can no longer be cancelled");
        }
        return updateStatus(orderId, OrderStatus.CANCELLED);
    }

    // Admin: assign (or, with a null agentId, unassign) a delivery agent to this order.
    @Transactional
    public OrderResponse assignAgent(Long orderId, Long agentId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        if (agentId == null) {
            order.setDeliveryAgent(null);
        } else {
            DeliveryAgent agent = deliveryAgentRepository.findById(agentId)
                    .filter(DeliveryAgent::isActive)
                    .orElseThrow(() -> new IllegalArgumentException("Delivery agent not found or inactive"));
            order.setDeliveryAgent(agent);
        }
        return toResponse(orderRepository.save(order));
    }

    // Delivery-agent self-service: their own assigned, still-undelivered orders, looked
    // up by their own phone number plus the secret key the admin gave them - a phone
    // number alone (often also the customer-facing contact number) isn't a secret, so
    // it can't be the only thing gating who sees an agent's delivery list.
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForAgent(String phone, String secretKey) {
        authenticateAgent(phone, secretKey);
        return orderRepository.findByDeliveryAgent_PhoneAndStatusNotInOrderByCreatedAtDesc(
                        phone, List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED))
                .stream().map(this::toResponse).toList();
    }

    // Delivery-agent self-service: mark an order they're assigned to as delivered,
    // verified by their own phone number + secret key (mirrors cancelOrder's
    // customer-phone check, with the extra key since the phone alone isn't secret).
    @Transactional
    public OrderResponse markDelivered(Long orderId, String agentPhone, String secretKey) {
        authenticateAgent(agentPhone, secretKey);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        if (order.getDeliveryAgent() == null || !order.getDeliveryAgent().getPhone().equals(agentPhone)) {
            throw new IllegalArgumentException("This order isn't assigned to you");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("This order was cancelled");
        }
        return updateStatus(orderId, OrderStatus.DELIVERED);
    }

    // Shared by every agent self-service lookup. Deliberately gives the same error for
    // "no such phone" and "wrong key" so this can't be used to probe which phone numbers
    // belong to registered agents.
    private void authenticateAgent(String phone, String secretKey) {
        boolean valid = deliveryAgentRepository.findByPhone(phone)
                .filter(DeliveryAgent::isActive)
                .map(agent -> agent.getSecretKey() != null && agent.getSecretKey().equals(secretKey))
                .orElse(false);
        if (!valid) {
            throw new IllegalArgumentException("Invalid phone number or key");
        }
    }


    /**
     * Applies the customer's delivery choice: a scheduled slot, or express.
     *
     * <p>The slot is re-validated HERE rather than trusted from the checkout page. Between the
     * page rendering its list and the customer pressing Order, the slot can fill or its window
     * can pass -- validating only at render time lets the last two customers both take the last
     * place. {@code requireSelectable} re-checks capacity against live order counts.
     *
     * <p>Express is refused when the toggle is off, so a stale browser tab (or a crafted request)
     * cannot promise a 20-minute delivery the kitchen has switched off.
     */
    private void applyDeliveryChoice(Order order, CreateOrderRequest request) {
        boolean wantsExpress = Boolean.TRUE.equals(request.getExpressDelivery());
        if (wantsExpress) {
            if (!restaurantSettingsService.isExpressDeliveryEnabled()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Express delivery is not available right now. Please choose a delivery slot.");
            }
            order.setExpressDelivery(true);
            order.setDeliverySlot(null);   // express is INSTEAD of a slot, never alongside one
            return;
        }
        if (request.getDeliverySlotId() == null) {
            // MANDATORY. Every order must carry a delivery time, so the kitchen always knows
            // when a bowl is due rather than inferring it from when the order happened to
            // arrive. Note the consequence: with no slots configured and express off, no order
            // can be placed at all -- so at least one slot has to exist before taking orders.
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Please choose a delivery time for your order.");
        }
        order.setDeliverySlot(deliverySlotService.requireSelectable(request.getDeliverySlotId()));
    }

    private OrderResponse toResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getItems().stream().map(oi -> {
            // One entry per variant group (e.g. "Choose your sprouts: Moong, Chana, Mixed"),
            // not one per option - LinkedHashMap keeps groups in the order they first appear.
            List<String> selections = oi.getSelections().stream()
                    .collect(Collectors.groupingBy(
                            OrderItemSelection::getVariantGroupName,
                            LinkedHashMap::new,
                            Collectors.mapping(OrderItemSelection::getOptionName, Collectors.toList())
                    ))
                    .entrySet().stream()
                    .map(e -> e.getKey() + ": " + String.join(", ", e.getValue()))
                    .toList();
            return new OrderResponse.OrderItemResponse(
                    oi.getMenuItemName(), oi.getQuantity(), oi.getUnitPrice(), oi.getLineTotal(), selections);
        }).toList();

        String communityColor = order.getCommunity().getColor();
        DeliveryAgent agent = order.getDeliveryAgent();
        DeliverySlot slot = order.getDeliverySlot();
        // subtotalAmount/discountAmount are nullable in the DB - orders placed before these
        // columns existed predate the concept of an order-level discount, so they fall back
        // to "no discount" (subtotal == total) rather than being backfilled.
        BigDecimal subtotalAmount = order.getSubtotalAmount() != null ? order.getSubtotalAmount() : order.getTotalAmount();
        BigDecimal discountAmount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        return new OrderResponse(
                order.getId(), order.getCustomerName(), order.getCustomerPhone(),
                order.getCommunity().getName(), communityColor != null ? communityColor : "#4b5744",
                order.getTower(), order.getFlatNumber(),
                order.getNotes(), subtotalAmount, discountAmount, order.getDiscountReason(),
                order.getTotalAmount(), order.getStatus().name(),
                order.getCreatedAt(),
                agent != null ? agent.getId() : null,
                agent != null ? agent.getName() : null,
                agent != null ? agent.getPhone() : null,
                slot != null ? slot.getLabel() : null,
                slot != null ? slot.getStartTime() + " - " + slot.getEndTime() : null,
                order.isExpressDelivery(),
                items
        );
    }
}
