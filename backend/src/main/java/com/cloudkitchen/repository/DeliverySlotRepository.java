package com.cloudkitchen.repository;

import com.cloudkitchen.entity.DeliverySlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliverySlotRepository extends JpaRepository<DeliverySlot, Long> {

    List<DeliverySlot> findAllByOrderBySortOrderAscStartTimeAsc();

    List<DeliverySlot> findByActiveTrueOrderBySortOrderAscStartTimeAsc();
}
