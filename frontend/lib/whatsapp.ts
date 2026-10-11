import { Coupon, OrderResponse } from "./types";

/**
 * Builds a WhatsApp click-to-chat link for telling a customer their order is on its way.
 *
 * <p>WHY A LINK AND NOT AN API CALL. WhatsApp does not let a business message a customer out of
 * the blue without a message template Meta has approved in advance - that is their rule, and
 * approval takes days. A wa.me link sidesteps it entirely: the admin taps once and sends from
 * their own WhatsApp, which is a normal person-to-person message. It costs nothing, needs no
 * account and works today. If an approved template arrives later, the automatic send belongs in
 * OrderService.updateStatus where the push notification already fires.
 */

/**
 * India. Every other phone default in this app (+91 placeholders, rupee prices) assumes it, and
 * wa.me needs a country code - a bare 10-digit number silently opens the wrong chat.
 */
const DEFAULT_COUNTRY_CODE = "91";

/** Normalises a stored phone into the digits-only, country-coded form wa.me expects. */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return DEFAULT_COUNTRY_CODE + digits;
  // Already carries a country code (12 for +91XXXXXXXXXX), or came in as 0XXXXXXXXXX.
  if (digits.length === 11 && digits.startsWith("0")) return DEFAULT_COUNTRY_CODE + digits.slice(1);
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null; // too short to be a real number - better no button than the wrong chat
}

/**
 * The message text. The agent's name and number are included only when an agent is actually
 * assigned: "your rider undefined" is worse than not mentioning a rider at all.
 */
export function outForDeliveryMessage(order: OrderResponse, restaurantName: string): string {
  const firstName = (order.customerName || "").split(" ")[0] || "there";
  const lines = [
    `Hi ${firstName}, your ${restaurantName} order #${order.id} is out for delivery.`,
  ];
  if (order.deliveryAgentName) {
    lines.push(
      order.deliveryAgentPhone
        ? `${order.deliveryAgentName} is bringing it over - you can reach them on ${order.deliveryAgentPhone}.`
        : `${order.deliveryAgentName} is bringing it over.`,
    );
  }
  lines.push("See you shortly!");
  return lines.join("\n\n");
}

/** Full wa.me URL, or null when the customer's number cannot be used. */
export function outForDeliveryWhatsAppLink(
  order: OrderResponse,
  restaurantName: string,
): string | null {
  const number = toWhatsAppNumber(order.customerPhone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(outForDeliveryMessage(order, restaurantName))}`;
}

/**
 * The message that actually delivers a coupon to the customer.
 *
 * <p>This is the step that makes the whole scheme work: a coupon nobody has been told about is
 * just a database row. Sent after the order is paid for, it gives them a reason to come back.
 *
 * <p>Carries the condition and the expiry as well as the code, because "Rs 50 off" with no
 * mention of the 2-salad rule reads as a promise the checkout will then refuse.
 */
export function couponMessage(coupon: Coupon, restaurantName: string): string {
  const expires = new Date(coupon.expiresAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return [
    `Thanks for ordering from ${restaurantName}!`,
    `Here is a coupon for your next order: ${coupon.code}`,
    `${coupon.description}. Valid until ${expires}.`,
    "Just enter the code at checkout.",
  ].join("\n\n");
}

/** wa.me link for sending a coupon, or null when the number cannot be used. */
export function couponWhatsAppLink(coupon: Coupon, restaurantName: string): string | null {
  const number = toWhatsAppNumber(coupon.phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(couponMessage(coupon, restaurantName))}`;
}
