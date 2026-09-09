package com.cloudkitchen.dto;

import java.time.Instant;

public record CustomerResponse(Long id, String name, String phone, int orderCount, Instant createdAt) {
}
