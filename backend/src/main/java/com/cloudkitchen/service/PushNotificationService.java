package com.cloudkitchen.service;

import com.cloudkitchen.dto.PushSubscriptionRequest;
import com.cloudkitchen.entity.Order;
import com.cloudkitchen.repository.OrderRepository;
import com.cloudkitchen.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.Security;
import java.time.Instant;
import java.util.List;

/**
 * Sends the "your order is out for delivery" push, and stores the subscriptions that make it
 * possible.
 *
 * <h2>Why this exists alongside the in-page banner</h2>
 * The banner on the order page only fires while that page is open. A customer who places an
 * order and closes the tab — which is most of them — can never see it. Web Push is the only
 * mechanism that reaches a closed browser.
 *
 * <h2>What it cannot do</h2>
 * On iOS, Safari delivers push only to sites the user has added to their Home Screen
 * (iOS 16.4+). A customer who simply visits the site in Safari gets nothing, and no error:
 * their browser never creates a subscription in the first place, so there is nothing here to
 * fail. That is a platform limitation, not something this code can work around.
 */
@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    static {
        // The web-push library signs with P-256 and encrypts with ECDH, neither of which the
        // stock JDK provider covers in the shape the library expects.
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    private final PushSubscriptionRepository subscriptionRepository;
    private final OrderRepository orderRepository;
    private final String publicKey;
    private final String privateKey;
    private final String subject;

    public PushNotificationService(PushSubscriptionRepository subscriptionRepository,
                                   OrderRepository orderRepository,
                                   @Value("${app.push.vapid.public-key:}") String publicKey,
                                   @Value("${app.push.vapid.private-key:}") String privateKey,
                                   @Value("${app.push.vapid.subject:mailto:kitchen@example.com}") String subject) {
        this.subscriptionRepository = subscriptionRepository;
        this.orderRepository = orderRepository;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.subject = subject;
    }

    /** Whether push is configured at all. Without keys the whole feature is simply off. */
    public boolean isEnabled() {
        return !publicKey.isBlank() && !privateKey.isBlank();
    }

    public String getPublicKey() {
        return publicKey;
    }

    /**
     * Records a browser's subscription against an order.
     *
     * <p>Upserts on (order, endpoint): a customer who reloads the page resubscribes with the
     * same endpoint, and storing that twice would push twice.
     */
    @Transactional
    public void subscribe(PushSubscriptionRequest request) {
        Order order = orderRepository.findById(request.getOrderId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        com.cloudkitchen.entity.PushSubscription subscription = subscriptionRepository
                .findByOrderIdAndEndpoint(order.getId(), request.getEndpoint())
                .orElseGet(com.cloudkitchen.entity.PushSubscription::new);

        subscription.setOrder(order);
        subscription.setEndpoint(request.getEndpoint());
        subscription.setP256dh(request.getP256dh());
        subscription.setAuth(request.getAuth());
        subscriptionRepository.save(subscription);
    }

    /**
     * Pushes the out-for-delivery message to every browser subscribed to this order.
     *
     * <p>Never throws. A push failure must not roll back or fail the status update that
     * triggered it — the order really is out for delivery whether or not the phone was
     * reachable, and an admin should not see an error for something outside the kitchen.
     *
     * <p>Sends at most once per order: subscriptions are stamped with notifiedAt, so a second
     * status change back and forth cannot produce a second buzz, and two devices subscribed to
     * the same order do not each trigger their own round.
     */
    @Transactional
    public void notifyOutForDelivery(Order order, String restaurantName) {
        if (!isEnabled()) {
            return;
        }
        List<com.cloudkitchen.entity.PushSubscription> subscriptions =
                subscriptionRepository.findByOrderId(order.getId());
        if (subscriptions.isEmpty()) {
            return;
        }
        if (subscriptions.stream().anyMatch(s -> s.getNotifiedAt() != null)) {
            log.debug("[push] order {} already notified, skipping", order.getId());
            return;
        }

        String payload = """
                {"title":"Your order is on the way",\
                "body":"%s has sent order #%d out for delivery.",\
                "orderId":%d}"""
                .formatted(restaurantName.replace("\"", ""), order.getId(), order.getId());

        for (com.cloudkitchen.entity.PushSubscription subscription : subscriptions) {
            try {
                PushService pushService = new PushService(publicKey, privateKey, subject);
                Notification notification = new Notification(
                        subscription.getEndpoint(), subscription.getP256dh(),
                        subscription.getAuth(), payload.getBytes());
                var response = pushService.send(notification);
                int status = response.getStatusLine().getStatusCode();
                if (status == 404 || status == 410) {
                    // The push service is telling us this subscription is dead — the browser was
                    // uninstalled, or permission revoked. Keeping it means retrying forever.
                    log.info("[push] subscription gone (HTTP {}), removing: order {}", status, order.getId());
                    subscriptionRepository.deleteByEndpoint(subscription.getEndpoint());
                } else if (status >= 300) {
                    log.warn("[push] push for order {} returned HTTP {}", order.getId(), status);
                } else {
                    subscription.setNotifiedAt(Instant.now());
                    subscriptionRepository.save(subscription);
                }
            } catch (Exception e) {
                log.warn("[push] could not push for order {}: {}", order.getId(), e.toString());
            }
        }
    }
}
