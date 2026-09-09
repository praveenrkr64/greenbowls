package com.cloudkitchen.dto;

public record RestaurantInfoDto(
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
        // Drives whether checkout offers the express option at all. Public because the
        // customer checkout page needs it before any order exists.
        Boolean expressDeliveryEnabled,
        Integer expressDeliveryMinutes,
        // Banner rotation interval in ms; always populated, never null.
        Integer heroRotationMs,
        // Null or blank means the "Who we are" button is hidden.
        String aboutUs,
        String orderConfirmMessage
) {}
