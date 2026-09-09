package com.cloudkitchen.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "variant_options")
public class VariantOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_group_id", nullable = false)
    private VariantGroup variantGroup;

    // e.g. "Moong sprouts", "Chicken", "Paneer"
    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal priceDelta = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean active = true;

    private Integer sortOrder = 0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public VariantGroup getVariantGroup() { return variantGroup; }
    public void setVariantGroup(VariantGroup variantGroup) { this.variantGroup = variantGroup; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPriceDelta() { return priceDelta; }
    public void setPriceDelta(BigDecimal priceDelta) { this.priceDelta = priceDelta; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
