package com.cloudkitchen.repository;

import com.cloudkitchen.entity.ApartmentCommunity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApartmentCommunityRepository extends JpaRepository<ApartmentCommunity, Long> {
    List<ApartmentCommunity> findByActiveTrueOrderByNameAsc();
    List<ApartmentCommunity> findAllByOrderByNameAsc();
    // Rows that predate the color column - see CommunityColorBackfillRunner.
    List<ApartmentCommunity> findByColorIsNull();
}
