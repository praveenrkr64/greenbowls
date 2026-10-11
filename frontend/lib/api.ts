import { Category, Community, Coupon, CouponType, CouponValidationResult, HeroSlide, HeroSlideAdmin, SubscriptionRequest, CommunityAdmin, Customer, CustomerProfile, DeliveryAgentAdmin, DeliverySlot, DeliverySlotAdmin, Expense, ExpenseSummary, MenuItem, MenuItemAdmin, OrderResponse, PageResponse, PromoBanner, PromoBannerAdmin, RestaurantInfo, RestaurantSettingsAdmin } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const adminHeaders = { "X-Admin-Key": process.env.NEXT_PUBLIC_ADMIN_API_KEY || "" };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export function getMenu(): Promise<MenuItem[]> {
  return request<MenuItem[]>("/api/menu");
}

export function getCommunities(): Promise<Community[]> {
  return request<Community[]>("/api/communities");
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>("/api/categories");
}

export interface CategoryAdminPayload {
  name: string;
  description: string;
}

export function getAdminCategories(): Promise<Category[]> {
  return request<Category[]>("/api/admin/categories", { headers: adminHeaders });
}

export function createCategory(payload: CategoryAdminPayload): Promise<Category> {
  return request<Category>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

export function updateCategory(id: number, payload: CategoryAdminPayload): Promise<Category> {
  return request<Category>(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

export function deleteCategory(id: number): Promise<void> {
  return request<void>(`/api/admin/categories/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

export function getRestaurantInfo(): Promise<RestaurantInfo> {
  return request<RestaurantInfo>("/api/restaurant-info");
}

// Admin-only view of the same settings, plus adminEmail (never exposed publicly).
export function getAdminRestaurantInfo(): Promise<RestaurantSettingsAdmin> {
  return request<RestaurantSettingsAdmin>("/api/admin/restaurant-info", { headers: adminHeaders });
}

export interface RestaurantInfoPayload {
  name: string;
  phone: string;
  nameStyle: string;
  tagline: string;
  taglineStyle: string;
  heroImageUrl: string;
  eyebrowText: string;
  eyebrowStyle: string;
  showFeatureBadges: boolean;
  featureBadgesText: string;
  adminEmail: string;
  expressDeliveryEnabled: boolean;
  expressDeliveryMinutes: number;
  // Optional: omitted by forms that don't own it, and the backend leaves it unchanged.
  heroRotationMs?: number;
  orderConfirmMessage: string;
  aboutUs?: string;
  mailHost?: string;
  mailPort?: number | null;
  mailUsername?: string;
  /** Write-only. Blank leaves the stored password unchanged. */
  mailPassword?: string;
  clearMailPassword?: boolean;
  mailFrom?: string;
}

export function updateRestaurantInfo(payload: RestaurantInfoPayload): Promise<RestaurantSettingsAdmin> {
  return request<RestaurantSettingsAdmin>("/api/admin/restaurant-info", {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

// Admin-only: upload an image file (e.g. the hero image) and get back a URL to store.
export async function uploadMedia(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/admin/uploads`, {
    method: "POST",
    body: formData,
    headers: adminHeaders,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}

// Public: the images the menu-page banner rotates through, in display order.
export function getHeroSlides(): Promise<HeroSlide[]> {
  return request<HeroSlide[]>("/api/hero-slides");
}

export interface HeroSlideAdminPayload {
  enabled: boolean;
  imageUrl: string;
  sortOrder: number;
}

export function getAdminHeroSlides(): Promise<HeroSlideAdmin[]> {
  return request<HeroSlideAdmin[]>("/api/admin/hero-slides", { headers: adminHeaders });
}

export function createHeroSlide(payload: HeroSlideAdminPayload): Promise<HeroSlideAdmin> {
  return request<HeroSlideAdmin>("/api/admin/hero-slides", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify(payload),
  });
}

export function updateHeroSlide(id: number, payload: HeroSlideAdminPayload): Promise<HeroSlideAdmin> {
  return request<HeroSlideAdmin>(`/api/admin/hero-slides/${id}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify(payload),
  });
}

export function deleteHeroSlide(id: number): Promise<void> {
  return request<void>(`/api/admin/hero-slides/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

// Public: every enabled banner - any number can run at once.
export function getPromoBanners(): Promise<PromoBanner[]> {
  return request<PromoBanner[]>("/api/promo-banners");
}

export interface PromoBannerAdminPayload {
  enabled: boolean;
  message: string;
}

export function getAdminPromoBanners(): Promise<PromoBannerAdmin[]> {
  return request<PromoBannerAdmin[]>("/api/admin/promo-banners", { headers: adminHeaders });
}

export function createPromoBanner(payload: PromoBannerAdminPayload): Promise<PromoBannerAdmin> {
  return request<PromoBannerAdmin>("/api/admin/promo-banners", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

export function updatePromoBanner(id: number, payload: PromoBannerAdminPayload): Promise<PromoBannerAdmin> {
  return request<PromoBannerAdmin>(`/api/admin/promo-banners/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

export function deletePromoBanner(id: number): Promise<void> {
  return request<void>(`/api/admin/promo-banners/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

export interface CreateOrderPayload {
  // Exactly one of these: a slot for a scheduled delivery, or express for a 20-minute one.
  // The server re-validates both, so sending neither is allowed and simply means no slot.
  deliverySlotId?: number | null;
  expressDelivery?: boolean;
  customerName: string;
  customerPhone: string;
  communityId: number;
  tower: string;
  flatNumber: string;
  notes?: string;
  /** Optional; the server re-validates it and may ignore it if the welcome offer is larger. */
  couponCode?: string;
  items: {
    menuItemId: number;
    quantity: number;
    selectedOptionIds: number[];
  }[];
}

export function getDeliverySlots(): Promise<DeliverySlot[]> {
  return request<DeliverySlot[]>("/api/delivery-slots");
}

export function getAdminDeliverySlots(): Promise<DeliverySlotAdmin[]> {
  return request<DeliverySlotAdmin[]>("/api/admin/delivery-slots", { headers: adminHeaders });
}

export interface DeliverySlotPayload {
  // Optional: the server fills the legacy label column from the times when it is absent.
  label?: string;
  startTime: string;
  endTime: string;
  maxOrders: number | null;
  active: boolean;
  sortOrder: number;
}

export function createDeliverySlot(payload: DeliverySlotPayload): Promise<DeliverySlotAdmin> {
  return request<DeliverySlotAdmin>("/api/admin/delivery-slots", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify(payload),
  });
}

export function updateDeliverySlot(id: number, payload: DeliverySlotPayload): Promise<DeliverySlotAdmin> {
  return request<DeliverySlotAdmin>(`/api/admin/delivery-slots/${id}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify(payload),
  });
}

export function deleteDeliverySlot(id: number): Promise<void> {
  return request<void>(`/api/admin/delivery-slots/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

export interface ExpensePayload {
  itemName: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  amount: number;
  spentOn: string | null;
  vendor: string | null;
  notes: string | null;
}

export function getExpenses(from?: string, to?: string): Promise<ExpenseSummary> {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const suffix = qs.toString() ? `?${qs}` : "";
  return request<ExpenseSummary>(`/api/admin/expenses${suffix}`, { headers: adminHeaders });
}

export function createExpense(payload: ExpensePayload): Promise<Expense> {
  return request<Expense>("/api/admin/expenses", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify(payload),
  });
}

export function updateExpense(id: number, payload: ExpensePayload): Promise<Expense> {
  return request<Expense>(`/api/admin/expenses/${id}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(id: number): Promise<void> {
  return request<void>(`/api/admin/expenses/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

export function createOrder(payload: CreateOrderPayload): Promise<OrderResponse> {
  return request<OrderResponse>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface GetOrdersParams {
  filter?: string;
  sortBy?: string;
  page?: number;
  size?: number;
}

export function getOrders(params: GetOrdersParams = {}): Promise<PageResponse<OrderResponse>> {
  const { filter = "ALL", sortBy = "newest", page = 0, size = 20 } = params;
  const query = new URLSearchParams({ filter, sortBy, page: String(page), size: String(size) });
  return request<PageResponse<OrderResponse>>(`/api/orders?${query.toString()}`, {
    headers: adminHeaders,
  });
}

export function getOrder(id: number): Promise<OrderResponse> {
  return request<OrderResponse>(`/api/orders/${id}`);
}

// Public: a customer's own last 3 orders, looked up by their own phone number.
export function getMyRecentOrders(phone: string): Promise<OrderResponse[]> {
  return request<OrderResponse[]>(`/api/orders/recent?phone=${encodeURIComponent(phone)}`);
}

// Public: cancel your own order - only allowed while it's still NEW/CONFIRMED.
export function cancelOrder(id: number, phone: string): Promise<OrderResponse> {
  return request<OrderResponse>(`/api/orders/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ phone }),
  });
}

export function updateOrderStatus(id: number, status: string): Promise<OrderResponse> {
  return request<OrderResponse>(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    headers: adminHeaders,
  });
}

export interface MenuItemAdminPayload {
  name: string;
  description: string;
  basePrice: number;
  discountedPrice: number | null;
  category: string;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
  variantGroups: {
    name: string;
    required: boolean;
    minSelect: number;
    maxSelect: number;
    sortOrder: number;
    options: {
      name: string;
      priceDelta: number;
      active: boolean;
      sortOrder: number;
    }[];
  }[];
}

export function getAdminMenu(): Promise<MenuItemAdmin[]> {
  return request<MenuItemAdmin[]>("/api/admin/menu", { headers: adminHeaders });
}

export function createMenuItem(payload: MenuItemAdminPayload): Promise<MenuItemAdmin> {
  return request<MenuItemAdmin>("/api/admin/menu", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

export function updateMenuItem(id: number, payload: MenuItemAdminPayload): Promise<MenuItemAdmin> {
  return request<MenuItemAdmin>(`/api/admin/menu/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

export function deactivateMenuItem(id: number): Promise<void> {
  return request<void>(`/api/admin/menu/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

export function updateMenuItemSortOrder(id: number, sortOrder: number): Promise<MenuItemAdmin> {
  return request<MenuItemAdmin>(`/api/admin/menu/${id}/sort-order`, {
    method: "PATCH",
    body: JSON.stringify({ sortOrder }),
    headers: adminHeaders,
  });
}

export function getCustomers(): Promise<Customer[]> {
  return request<Customer[]>("/api/customers", { headers: adminHeaders });
}

export function getCustomerRecentOrders(phone: string): Promise<OrderResponse[]> {
  return request<OrderResponse[]>(`/api/customers/${encodeURIComponent(phone)}/orders`, {
    headers: adminHeaders,
  });
}

// Public: checkout autofill for a returning customer, by their own phone number.
// Returns null (not an error) when this phone hasn't ordered before.
export async function getCustomerProfile(phone: string): Promise<CustomerProfile | null> {
  const res = await fetch(`${API_BASE}/api/customers/${encodeURIComponent(phone)}/profile`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export interface CommunityAdminPayload {
  name: string;
  active: boolean;
  color: string;
}

export function getAdminCommunities(): Promise<CommunityAdmin[]> {
  return request<CommunityAdmin[]>("/api/admin/communities", { headers: adminHeaders });
}

export function createCommunity(payload: CommunityAdminPayload): Promise<CommunityAdmin> {
  return request<CommunityAdmin>("/api/admin/communities", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

export function updateCommunity(id: number, payload: CommunityAdminPayload): Promise<CommunityAdmin> {
  return request<CommunityAdmin>(`/api/admin/communities/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

export function deactivateCommunity(id: number): Promise<void> {
  return request<void>(`/api/admin/communities/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

export interface DeliveryAgentAdminPayload {
  name: string;
  phone: string;
  secretKey: string;
  active: boolean;
}

export function getAdminDeliveryAgents(): Promise<DeliveryAgentAdmin[]> {
  return request<DeliveryAgentAdmin[]>("/api/admin/delivery-agents", { headers: adminHeaders });
}

export function createDeliveryAgent(payload: DeliveryAgentAdminPayload): Promise<DeliveryAgentAdmin> {
  return request<DeliveryAgentAdmin>("/api/admin/delivery-agents", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

export function updateDeliveryAgent(id: number, payload: DeliveryAgentAdminPayload): Promise<DeliveryAgentAdmin> {
  return request<DeliveryAgentAdmin>(`/api/admin/delivery-agents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: adminHeaders,
  });
}

export function deactivateDeliveryAgent(id: number): Promise<void> {
  return request<void>(`/api/admin/delivery-agents/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

// Admin: assign (or, with agentId null, unassign) a delivery agent to an order.
export function assignDeliveryAgent(orderId: number, agentId: number | null): Promise<OrderResponse> {
  return request<OrderResponse>(`/api/orders/${orderId}/assign-agent`, {
    method: "PATCH",
    body: JSON.stringify({ agentId }),
    headers: adminHeaders,
  });
}

// Public: a delivery agent's own assigned, still-undelivered orders, looked up by
// their own phone number + secret key.
export function getAssignedOrders(phone: string, secretKey: string): Promise<OrderResponse[]> {
  const query = new URLSearchParams({ phone, key: secretKey });
  return request<OrderResponse[]>(`/api/orders/assigned?${query.toString()}`);
}

// Public: a delivery agent marking their own assigned order delivered, verified by
// phone number + secret key.
export function markOrderDelivered(orderId: number, phone: string, secretKey: string): Promise<OrderResponse> {
  return request<OrderResponse>(`/api/orders/${orderId}/deliver`, {
    method: "PATCH",
    body: JSON.stringify({ phone, secretKey }),
  });
}

// --- Subscription call-back requests -------------------------------------------------------
// Creating one is public (a customer asking to be rung); the rest is admin-only.

export interface SubscriptionRequestPayload {
  customerName: string;
  phone: string;
  planType: "WEEKLY" | "MONTHLY";
}

export function createSubscriptionRequest(
  payload: SubscriptionRequestPayload,
): Promise<SubscriptionRequest> {
  return request<SubscriptionRequest>("/api/subscription-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSubscriptionRequests(): Promise<SubscriptionRequest[]> {
  return request<SubscriptionRequest[]>("/api/admin/subscription-requests", { headers: adminHeaders });
}

export function updateSubscriptionRequest(
  id: number,
  payload: { status?: string; notes?: string },
): Promise<SubscriptionRequest> {
  return request<SubscriptionRequest>(`/api/admin/subscription-requests/${id}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify(payload),
  });
}

export function deleteSubscriptionRequest(id: number): Promise<void> {
  return request<void>(`/api/admin/subscription-requests/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

// --- Coupons ---------------------------------------------------------------------------------

/** Public: previews a code against the cart. The server re-prices the cart from the database. */
export function validateCoupon(payload: {
  code: string;
  phone: string;
  items: { menuItemId: number; quantity: number }[];
}): Promise<CouponValidationResult> {
  return request<CouponValidationResult>("/api/coupons/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface CouponTypePayload {
  name: string;
  reusable?: boolean;
  adminOnly?: boolean;
  discountAmount: number;
  conditionType: "NONE" | "MIN_ORDER_TOTAL" | "MIN_CATEGORY_QUANTITY";
  minOrderTotal?: number | null;
  categoryName?: string | null;
  minQuantity?: number | null;
  validityDays: number;
  autoIssueOnDelivery: boolean;
  active?: boolean;
}

export function getCouponTypes(): Promise<CouponType[]> {
  return request<CouponType[]>("/api/admin/coupon-types", { headers: adminHeaders });
}

export function createCouponType(payload: CouponTypePayload): Promise<CouponType> {
  return request<CouponType>("/api/admin/coupon-types", {
    method: "POST", headers: adminHeaders, body: JSON.stringify(payload),
  });
}

export function updateCouponType(id: number, payload: CouponTypePayload): Promise<CouponType> {
  return request<CouponType>(`/api/admin/coupon-types/${id}`, {
    method: "PUT", headers: adminHeaders, body: JSON.stringify(payload),
  });
}

export function deleteCouponType(id: number): Promise<void> {
  return request<void>(`/api/admin/coupon-types/${id}`, { method: "DELETE", headers: adminHeaders });
}

export function getCoupons(phone?: string): Promise<Coupon[]> {
  const q = phone ? `?phone=${encodeURIComponent(phone)}` : "";
  return request<Coupon[]>(`/api/admin/coupons${q}`, { headers: adminHeaders });
}

/** Admin check of a single code. Empty array means no coupon with that code exists. */
export function lookupCoupon(code: string): Promise<Coupon[]> {
  return request<Coupon[]>(`/api/admin/coupons?code=${encodeURIComponent(code)}`, {
    headers: adminHeaders,
  });
}

/** phone is omitted for a master coupon, which belongs to nobody. */
export function issueCoupon(payload: { couponTypeId: number; phone?: string }): Promise<Coupon> {
  return request<Coupon>("/api/admin/coupons", {
    method: "POST", headers: adminHeaders, body: JSON.stringify(payload),
  });
}

export function deleteCoupon(id: number): Promise<void> {
  return request<void>(`/api/admin/coupons/${id}`, { method: "DELETE", headers: adminHeaders });
}

/** Admin-only: put a coupon on an existing order. Used for reusable master coupons. */
export function applyCouponToOrder(orderId: number, code: string): Promise<OrderResponse> {
  return request<OrderResponse>(`/api/orders/${orderId}/apply-coupon`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ code }),
  });
}
