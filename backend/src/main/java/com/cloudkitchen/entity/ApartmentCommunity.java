package com.cloudkitchen.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "apartment_communities")
public class ApartmentCommunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private boolean active = true;

    // Hex color, e.g. #33562e - used to color-code this community's orders in the admin
    // view. Nullable in the DB (existing rows predate this column and are backfilled by
    // CommunityColorBackfillRunner); new entities always get a default in Java.
    private String color = "#33562e";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
