package com.cloudkitchen.repository;

import com.cloudkitchen.entity.RestaurantSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantSettingsRepository extends JpaRepository<RestaurantSettings, Long> {
}
