package com.cloudkitchen.dto;

// Same shape for public and admin use - a category's name/description carries no
// sensitive or admin-only data, unlike e.g. CommunityAdminDto vs CommunityDto.
public record CategoryDto(Long id, String name, String description) {}
