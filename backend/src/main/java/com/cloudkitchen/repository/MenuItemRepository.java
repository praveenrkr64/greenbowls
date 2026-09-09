package com.cloudkitchen.repository;

import com.cloudkitchen.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByActiveTrueOrderBySortOrderAsc();
    List<MenuItem> findAllByOrderBySortOrderAsc();
}
