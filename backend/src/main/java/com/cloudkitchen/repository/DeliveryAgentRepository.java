package com.cloudkitchen.repository;

import com.cloudkitchen.entity.DeliveryAgent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DeliveryAgentRepository extends JpaRepository<DeliveryAgent, Long> {
    List<DeliveryAgent> findByActiveTrueOrderByNameAsc();
    List<DeliveryAgent> findAllByOrderByNameAsc();
    Optional<DeliveryAgent> findByPhone(String phone);
}
