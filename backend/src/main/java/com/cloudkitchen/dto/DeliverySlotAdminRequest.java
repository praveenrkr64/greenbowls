package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public class DeliverySlotAdminRequest {

    @NotBlank(message = "Label is required")
    @Size(max = 80, message = "Label must be 80 characters or fewer")
    private String label;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    // 0 means unlimited. Negative is rejected rather than silently treated as unlimited,
    // because "-5" is far more likely a typo than an intent.
    @PositiveOrZero(message = "Max orders cannot be negative (use 0 for unlimited)")
    private Integer maxOrders;

    private Boolean active;

    private Integer sortOrder;

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public Integer getMaxOrders() { return maxOrders; }
    public void setMaxOrders(Integer maxOrders) { this.maxOrders = maxOrders; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
