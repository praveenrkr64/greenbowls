package com.cloudkitchen.entity;

import jakarta.persistence.*;

import java.time.Instant;

// A browser's permission slip for push notifications, stored per ORDER.
//
// Per-order rather than per-customer on purpose. The customer has no login, so the only
// stable identifier is a phone number they type in — and a subscription belongs to a
// browser, not a person. Someone who orders from their phone and later from a laptop has
// two subscriptions, and each should only be told about the order it was created for.
// Keying on the order also means a subscription becomes irrelevant the moment that order is
// delivered, which is what makes cleanup straightforward.
@Entity
@Table(name = "push_subscriptions",
       indexes = @Index(name = "idx_push_order", columnList = "order_id"))
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // The push service URL the browser gave us (FCM, Mozilla, WNS...). Long because these
    // are opaque and vendor-controlled; 500 is comfortably above what browsers emit today
    // but this is exactly the field that would silently truncate if sized meanly.
    @Column(nullable = false, length = 1000)
    private String endpoint;

    // The two halves of the encryption material. Without both, a push can be signed but not
    // encrypted, and the browser drops it.
    @Column(nullable = false, length = 255)
    private String p256dh;

    @Column(nullable = false, length = 255)
    private String auth;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // Set once a push has actually been delivered for this order, so a customer who has the
    // page open on two devices is not told twice by two subscriptions. The "one notification
    // per order" rule has to hold server-side too: localStorage only makes it true per browser.
    private Instant notifiedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getP256dh() { return p256dh; }
    public void setP256dh(String p256dh) { this.p256dh = p256dh; }

    public String getAuth() { return auth; }
    public void setAuth(String auth) { this.auth = auth; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getNotifiedAt() { return notifiedAt; }
    public void setNotifiedAt(Instant notifiedAt) { this.notifiedAt = notifiedAt; }
}
