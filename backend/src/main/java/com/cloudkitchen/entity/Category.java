package com.cloudkitchen.entity;

import jakarta.persistence.*;

// A menu category's own description (e.g. "Sprouts Bowls" -> "Protein-packed bowls
// built around fresh sprouts"), shown on the category header before it's expanded.
// name is matched against MenuItem.category (a free-text string, not a real FK) -
// deleting a Category row just removes its description, existing menu items keep
// their category string untouched.
@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 500)
    private String description;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
