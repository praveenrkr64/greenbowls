package com.cloudkitchen.controller;

import com.cloudkitchen.dto.DeliverySlotDto;
import com.cloudkitchen.service.DeliverySlotService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Public: the slots offered at checkout. Admin configuration lives in DeliverySlotAdminController.
@RestController
@RequestMapping("/api/delivery-slots")
public class DeliverySlotController {

    private final DeliverySlotService deliverySlotService;

    public DeliverySlotController(DeliverySlotService deliverySlotService) {
        this.deliverySlotService = deliverySlotService;
    }

    @GetMapping
    public List<DeliverySlotDto> list() {
        return deliverySlotService.getSelectableSlots();
    }
}
