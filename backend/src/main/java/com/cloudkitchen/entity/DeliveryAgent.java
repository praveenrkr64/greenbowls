package com.cloudkitchen.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "delivery_agents")
public class DeliveryAgent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(nullable = false)
    private boolean active = true;

    // Shared secret the agent must provide alongside their phone number to view or act
    // on their assigned orders - without this, anyone who learned an agent's phone
    // number (not a secret in itself - it's often also the customer-facing contact
    // number) could see their delivery list. Nullable in the DB since it was added
    // after agents already existed; enforced required for new/updated agents by
    // DeliveryAgentAdminRequest, and lookups fail closed if it's unset.
    private String secretKey;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
}
