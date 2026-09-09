package com.cloudkitchen.repository;

import com.cloudkitchen.entity.PromoBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromoBannerRepository extends JpaRepository<PromoBanner, Long> {
    List<PromoBanner> findByEnabledTrueOrderByIdAsc();
    List<PromoBanner> findAllByOrderByIdAsc();
}
