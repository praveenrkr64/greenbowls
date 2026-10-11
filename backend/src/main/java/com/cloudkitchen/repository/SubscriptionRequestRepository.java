package com.cloudkitchen.repository;

import com.cloudkitchen.entity.SubscriptionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubscriptionRequestRepository extends JpaRepository<SubscriptionRequest, Long> {
    List<SubscriptionRequest> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
