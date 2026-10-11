package com.cloudkitchen.repository;

import com.cloudkitchen.entity.CouponType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CouponTypeRepository extends JpaRepository<CouponType, Long> {
    List<CouponType> findAllByOrderByIdAsc();
    List<CouponType> findByActiveTrueAndAutoIssueOnDeliveryTrue();
}
