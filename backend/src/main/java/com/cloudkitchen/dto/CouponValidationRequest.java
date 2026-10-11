package com.cloudkitchen.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * What the checkout page sends to preview a coupon: the code, whose it is, and the cart.
 *
 * <p>The cart is sent as menu item ids and quantities, NOT as a client-computed total. Prices and
 * categories are re-read from the database, so a customer editing the request cannot invent a
 * qualifying basket.
 */
public class CouponValidationRequest {

    @NotBlank(message = "Enter a coupon code")
    private String code;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private List<CartLine> items;

    public static class CartLine {
        private Long menuItemId;
        private int quantity = 1;

        public Long getMenuItemId() { return menuItemId; }
        public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public List<CartLine> getItems() { return items; }
    public void setItems(List<CartLine> items) { this.items = items; }
}
