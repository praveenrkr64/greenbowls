package com.cloudkitchen.dto;

// Admin view of restaurant settings - identical to the public RestaurantInfoDto plus
// adminEmail, which must never be exposed via the public /api/restaurant-info endpoint.
public record RestaurantSettingsAdminDto(
        String name,
        String phone,
        String nameStyle,
        String tagline,
        String taglineStyle,
        String heroImageUrl,
        String eyebrowText,
        String eyebrowStyle,
        boolean showFeatureBadges,
        String featureBadgesText,
        String adminEmail,
        Boolean expressDeliveryEnabled,
        Integer expressDeliveryMinutes,
        // Banner rotation interval in ms; always populated, never null.
        Integer heroRotationMs,
        // Null or blank means the "Who we are" button is hidden.
        String aboutUs,
        String orderConfirmMessage
) {}
