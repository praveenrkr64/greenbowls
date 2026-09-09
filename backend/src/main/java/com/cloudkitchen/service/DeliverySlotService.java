package com.cloudkitchen.service;

import com.cloudkitchen.dto.DeliverySlotAdminDto;
import com.cloudkitchen.dto.DeliverySlotAdminRequest;
import com.cloudkitchen.dto.DeliverySlotDto;
import com.cloudkitchen.entity.DeliverySlot;
import com.cloudkitchen.entity.OrderStatus;
import com.cloudkitchen.repository.DeliverySlotRepository;
import com.cloudkitchen.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class DeliverySlotService {

    // The kitchen's own timezone. "Is this slot in the past?" and "how many orders does it
    // have today?" are both questions about the kitchen's local day, not the server's UTC
    // day or the customer's device clock -- an order at 23:30 IST must not count against
    // tomorrow's capacity because UTC has already rolled over.
    private static final ZoneId KITCHEN_ZONE = ZoneId.of("Asia/Kolkata");

    private final DeliverySlotRepository slotRepository;
    private final OrderRepository orderRepository;

    public DeliverySlotService(DeliverySlotRepository slotRepository, OrderRepository orderRepository) {
        this.slotRepository = slotRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * What the customer can pick. Inactive slots are omitted entirely.
     *
     * <p>Availability is deliberately NOT a function of the clock. A slot the admin has enabled
     * is offered, whatever the time of day -- the kitchen decides what it can serve, and a slot
     * whose window has passed may still be a perfectly good choice for tomorrow, or for a
     * kitchen that works to its own schedule. The only thing that can take a slot away is the
     * admin disabling it, or its capacity being used up.
     */
    @Transactional(readOnly = true)
    public List<DeliverySlotDto> getSelectableSlots() {
        return slotRepository.findByActiveTrueOrderBySortOrderAscStartTimeAsc().stream()
                .map(this::toCustomerDto)
                .toList();
    }

    private DeliverySlotDto toCustomerDto(DeliverySlot slot) {
        boolean soldOut = isFull(slot);
        return new DeliverySlotDto(slot.getId(), slot.getLabel(), slot.getStartTime(),
                slot.getEndTime(), !soldOut, soldOut, soldOut ? "Fully booked" : null);
    }

    @Transactional(readOnly = true)
    public List<DeliverySlotAdminDto> getAllForAdmin() {
        return slotRepository.findAllByOrderBySortOrderAscStartTimeAsc().stream()
                .map(slot -> new DeliverySlotAdminDto(slot.getId(), slot.getLabel(),
                        slot.getStartTime(), slot.getEndTime(), slot.getMaxOrders(),
                        ordersToday(slot.getId()), slot.isActive(), slot.getSortOrder()))
                .toList();
    }

    /**
     * Checks a slot is a legitimate choice, and returns it. Called when an order is placed,
     * NOT when the checkout page is rendered -- a slot can fill in between the two, and
     * validating only at render time would let the last two customers both take the last
     * place.
     */
    @Transactional(readOnly = true)
    public DeliverySlot requireSelectable(Long slotId) {
        DeliverySlot slot = slotRepository.findById(slotId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.BAD_REQUEST, "That delivery slot no longer exists"));
        if (!slot.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "That delivery slot is no longer available");
        }
        if (isFull(slot)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "That delivery slot has just filled up. Please pick another.");
        }
        return slot;
    }

    private boolean isFull(DeliverySlot slot) {
        return !slot.isUnlimited() && ordersToday(slot.getId()) >= slot.getMaxOrders();
    }

    /** Orders placed against this slot during the kitchen's current day, cancellations excluded. */
    private long ordersToday(Long slotId) {
        LocalDate today = LocalDate.now(KITCHEN_ZONE);
        Instant from = today.atStartOfDay(KITCHEN_ZONE).toInstant();
        Instant to = today.plusDays(1).atStartOfDay(KITCHEN_ZONE).toInstant();
        // Cancelled orders free their place back up -- otherwise a slot stays "full" all day
        // because of an order nobody is cooking.
        return orderRepository.countByDeliverySlotIdAndCreatedAtBetweenAndStatusNot(
                slotId, from, to, OrderStatus.CANCELLED);
    }

    @Transactional
    public DeliverySlotAdminDto create(DeliverySlotAdminRequest request) {
        DeliverySlot slot = new DeliverySlot();
        apply(slot, request);
        return toAdminDto(slotRepository.save(slot));
    }

    @Transactional
    public DeliverySlotAdminDto update(Long id, DeliverySlotAdminRequest request) {
        DeliverySlot slot = slotRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery slot not found"));
        apply(slot, request);
        return toAdminDto(slotRepository.save(slot));
    }

    @Transactional
    public void delete(Long id) {
        if (!slotRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery slot not found");
        }
        // Orders keep their slot reference via ON DELETE SET NULL semantics at the JPA level:
        // Order.deliverySlot is optional, so a past order whose slot was later removed simply
        // shows no slot rather than blocking the delete or vanishing itself.
        slotRepository.deleteById(id);
    }

    private void apply(DeliverySlot slot, DeliverySlotAdminRequest request) {
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "End time must be after start time");
        }
        slot.setLabel(request.getLabel().trim());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setMaxOrders(request.getMaxOrders());
        if (request.getActive() != null) {
            slot.setActive(request.getActive());
        }
        if (request.getSortOrder() != null) {
            slot.setSortOrder(request.getSortOrder());
        }
    }

    private DeliverySlotAdminDto toAdminDto(DeliverySlot slot) {
        return new DeliverySlotAdminDto(slot.getId(), slot.getLabel(), slot.getStartTime(),
                slot.getEndTime(), slot.getMaxOrders(), ordersToday(slot.getId()),
                slot.isActive(), slot.getSortOrder());
    }
}
