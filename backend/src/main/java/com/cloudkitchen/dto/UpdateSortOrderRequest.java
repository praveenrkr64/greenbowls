package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateSortOrderRequest {
    @NotNull
    private Integer sortOrder;

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
