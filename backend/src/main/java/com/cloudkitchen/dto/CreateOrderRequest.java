package com.cloudkitchen.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public class CreateOrderRequest {

    @NotBlank
    private String customerName;

    @NotBlank
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String customerPhone;

    @NotNull
    private Long communityId;

    @NotBlank
    private String tower;

    @NotBlank
    private String flatNumber;

    private String notes;

    /** Optional coupon code. Re-validated server-side; never trusted for its discount. */
    private String couponCode;

    // Exactly one of these is expected: a slot id for a scheduled order, or expressDelivery
    // for a 20-minute one. Validation lives in OrderService, where the express toggle's
    // current value is known.
    private Long deliverySlotId;

    private Boolean expressDelivery;

    @NotEmpty
    @Valid
    private List<OrderItemRequest> items;

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public Long getCommunityId() { return communityId; }
    public void setCommunityId(Long communityId) { this.communityId = communityId; }

    public String getTower() { return tower; }
    public void setTower(String tower) { this.tower = tower; }

    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }

    public static class OrderItemRequest {
        @NotNull
        private Long menuItemId;

        private int quantity = 1;

        // list of selected variant option ids (flat across all groups for this item)
        private List<Long> selectedOptionIds;

        public Long getMenuItemId() { return menuItemId; }
        public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }

        public List<Long> getSelectedOptionIds() { return selectedOptionIds; }
        public void setSelectedOptionIds(List<Long> selectedOptionIds) { this.selectedOptionIds = selectedOptionIds; }
    }

    public Long getDeliverySlotId() { return deliverySlotId; }
    public void setDeliverySlotId(Long deliverySlotId) { this.deliverySlotId = deliverySlotId; }

    public Boolean getExpressDelivery() { return expressDelivery; }
    public void setExpressDelivery(Boolean expressDelivery) { this.expressDelivery = expressDelivery; }
}
