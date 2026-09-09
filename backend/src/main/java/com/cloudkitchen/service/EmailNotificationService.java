package com.cloudkitchen.service;

import com.cloudkitchen.dto.OrderResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Properties;

// Best-effort admin email notifications on the two events the kitchen operator cares
// about: a new order landing, and an order being marked delivered. Deliberately does
// NOT use Spring's autoconfigured JavaMailSender bean - building our own JavaMailSenderImpl
// per send lets us fail silently (log + skip) whenever SMTP or the admin's notification
// email isn't configured yet, rather than the app refusing to start or every order
// creation throwing because of a missing mail server.
@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    @Value("${app.mail.host:}")
    private String host;

    @Value("${app.mail.port:587}")
    private int port;

    @Value("${app.mail.username:}")
    private String username;

    @Value("${app.mail.password:}")
    private String password;

    @Value("${app.mail.from:}")
    private String from;

    private final RestaurantSettingsService restaurantSettingsService;

    public EmailNotificationService(RestaurantSettingsService restaurantSettingsService) {
        this.restaurantSettingsService = restaurantSettingsService;
    }

    // @Async: SMTP round-trips shouldn't add latency to a customer placing an order or
    // an admin/agent updating a status - see CloudKitchenApplication's @EnableAsync.
    @Async
    public void notifyNewOrder(OrderResponse order) {
        String body = "New order #" + order.id() + " just came in.\n\n"
                + "Customer: " + order.customerName() + " (" + order.customerPhone() + ")\n"
                + "Delivering to: " + order.communityName() + ", " + order.tower() + ", Flat " + order.flatNumber() + "\n"
                + (order.notes() != null && !order.notes().isBlank() ? "Notes: " + order.notes() + "\n" : "")
                + "\nItems:\n" + formatItems(order)
                + "\nSubtotal: Rs " + order.subtotalAmount()
                + (order.discountAmount().signum() > 0 ? "\nDiscount: -Rs " + order.discountAmount() + " (" + order.discountReason() + ")" : "")
                + "\nTotal: Rs " + order.totalAmount();
        send("New order #" + order.id() + " - " + order.customerName(), body);
    }

    @Async
    public void notifyOrderDelivered(OrderResponse order) {
        String body = "Order #" + order.id() + " has been marked delivered.\n\n"
                + "Customer: " + order.customerName() + " (" + order.customerPhone() + ")\n"
                + "Delivered to: " + order.communityName() + ", " + order.tower() + ", Flat " + order.flatNumber() + "\n"
                + (order.deliveryAgentName() != null ? "Delivery agent: " + order.deliveryAgentName() + "\n" : "")
                + "\nTotal: Rs " + order.totalAmount();
        send("Order #" + order.id() + " delivered", body);
    }

    private String formatItems(OrderResponse order) {
        StringBuilder sb = new StringBuilder();
        for (OrderResponse.OrderItemResponse item : order.items()) {
            sb.append("  ").append(item.quantity()).append(" x ").append(item.menuItemName());
            if (!item.selections().isEmpty()) {
                sb.append(" (").append(String.join(", ", item.selections())).append(")");
            }
            sb.append(" - Rs ").append(item.lineTotal()).append("\n");
        }
        return sb.toString();
    }

    private void send(String subject, String body) {
        String to = restaurantSettingsService.getAdminNotificationEmail();
        if (host == null || host.isBlank()) {
            log.debug("Email notification skipped - SMTP not configured");
            return;
        }
        if (to == null || to.isBlank()) {
            log.debug("Email notification skipped - no admin notification email configured");
            return;
        }
        try {
            JavaMailSenderImpl sender = new JavaMailSenderImpl();
            sender.setHost(host);
            sender.setPort(port);
            sender.setUsername(username);
            sender.setPassword(password);
            Properties props = sender.getJavaMailProperties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from != null && !from.isBlank() ? from : username);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            sender.send(message);
        } catch (Exception e) {
            // Never let a notification failure affect the order flow that triggered it.
            log.warn("Failed to send admin notification email: {}", e.getMessage());
        }
    }
}
