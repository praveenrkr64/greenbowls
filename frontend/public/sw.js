/* Service worker for Web Push.
 *
 * Deliberately minimal: it does NOT cache anything or intercept fetches. A caching service
 * worker on an ordering app is a good way to serve a stale menu or stale prices, and this
 * file exists for one reason only -- a push cannot be received by a page that is closed, and
 * only a service worker runs when the page is not.
 */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // A push with a non-JSON body should still surface something rather than nothing.
    payload = { title: "Order update", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Order update";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    // Collapses duplicates: if the same order somehow pushes twice, the second replaces the
    // first in the tray instead of stacking.
    tag: payload.orderId ? `ck-order-${payload.orderId}` : "ck-order",
    data: { orderId: payload.orderId || null },
    // Food arriving is worth a buzz -- this is the one notification the customer opted in for.
    requireInteraction: false,
  };

  // waitUntil keeps the worker alive until the notification is actually shown; without it the
  // browser may terminate the worker first and the push is silently dropped.
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const orderId = event.notification.data && event.notification.data.orderId;
  const url = orderId ? `/order/${orderId}` : "/";

  // Focus an already-open tab for this order rather than opening a second one.
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    }),
  );
});
