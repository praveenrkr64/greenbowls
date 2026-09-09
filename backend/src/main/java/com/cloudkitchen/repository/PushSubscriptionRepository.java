package com.cloudkitchen.repository;

import com.cloudkitchen.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    List<PushSubscription> findByOrderId(Long orderId);

    Optional<PushSubscription> findByOrderIdAndEndpoint(Long orderId, String endpoint);

    // Derived deletes are not wrapped in a transaction by Spring Data, unlike the inherited
    // deleteAll(), so without this every call throws "No EntityManager with actual transaction
    // available for current thread".
    @Transactional
    void deleteByEndpoint(String endpoint);
}
