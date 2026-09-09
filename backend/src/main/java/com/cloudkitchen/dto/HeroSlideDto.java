package com.cloudkitchen.dto;

// Public view: just what the slider needs to render. HeroSlideService filters to
// enabled=true before this is built, so there is no "enabled" field to expose.
public record HeroSlideDto(Long id, String imageUrl) {}
