package com.cloudkitchen.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "variant_groups")
public class VariantGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    // e.g. "Choose your sprouts", "Add protein"
    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean required = false;

    @Column(nullable = false)
    private Integer minSelect = 0;

    @Column(nullable = false)
    private Integer maxSelect = 1;

    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "variantGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VariantOption> options = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MenuItem getMenuItem() { return menuItem; }
    public void setMenuItem(MenuItem menuItem) { this.menuItem = menuItem; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public Integer getMinSelect() { return minSelect; }
    public void setMinSelect(Integer minSelect) { this.minSelect = minSelect; }

    public Integer getMaxSelect() { return maxSelect; }
    public void setMaxSelect(Integer maxSelect) { this.maxSelect = maxSelect; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public List<VariantOption> getOptions() { return options; }
    public void setOptions(List<VariantOption> options) { this.options = options; }

    /**
     * The minimum that actually applies, reconciling {@code required} with {@code minSelect}.
     *
     * <p>The two can disagree, and in live data they do: "Protein Rich Rice Bowl" ships four
     * groups flagged required with minSelect 0. Validating on minSelect alone then lets an order
     * through with nothing chosen for a group the kitchen considers mandatory -- the customer gets
     * a rice bowl with no rice specified.
     *
     * <p>Treating required as "at least one" fixes every such group at once, and keeps working if
     * an admin creates another the same way. Correcting the rows instead would fix today's data
     * and leave the next mistake to be discovered by a customer.
     */
    public int effectiveMinSelect() {
        int min = minSelect == null ? 0 : minSelect;
        return required && min < 1 ? 1 : min;
    }
}
