package com.cloudkitchen.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_item_selections")
public class OrderItemSelection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    // snapshots, not FKs, so historical orders survive menu edits
    @Column(nullable = false)
    private String variantGroupName;

    @Column(nullable = false)
    private String optionName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal priceDelta = BigDecimal.ZERO;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public OrderItem getOrderItem() { return orderItem; }
    public void setOrderItem(OrderItem orderItem) { this.orderItem = orderItem; }

    public String getVariantGroupName() { return variantGroupName; }
    public void setVariantGroupName(String variantGroupName) { this.variantGroupName = variantGroupName; }

    public String getOptionName() { return optionName; }
    public void setOptionName(String optionName) { this.optionName = optionName; }

    public BigDecimal getPriceDelta() { return priceDelta; }
    public void setPriceDelta(BigDecimal priceDelta) { this.priceDelta = priceDelta; }
}
