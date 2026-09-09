package com.cloudkitchen.dto;

// Admin view: includes inactive communities and the color used to color-code their
// orders, both of which the public CommunityDto omits.
public record CommunityAdminDto(Long id, String name, boolean active, String color) {}
