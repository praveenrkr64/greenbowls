package com.cloudkitchen.dto;

// Checkout autofill for a returning customer: their most recent delivery address,
// looked up by phone number - no login, phone is the only key (matches how this
// app already treats phone as the customer's identity everywhere else).
public record CustomerProfileDto(
        String name,
        String phone,
        Long communityId,
        String communityName,
        String tower,
        String flatNumber
) {}
