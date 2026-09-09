package com.cloudkitchen.dto;

// Public view: only the enabled banners' ids/messages - MenuController filters to
// enabled=true before this ever gets built, so there's no "enabled" field to expose.
public record PromoBannerDto(Long id, String message) {}
