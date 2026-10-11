package com.cloudkitchen.repository;

import com.cloudkitchen.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeIgnoreCase(String code);
    List<Coupon> findByPhoneOrderByIssuedAtDesc(String phone);
    List<Coupon> findAllByOrderByIssuedAtDesc();
    boolean existsByCode(String code);
}
