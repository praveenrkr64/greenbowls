export interface VariantOption {
  id: number;
  name: string;
  priceDelta: number;
}

export interface VariantGroup {
  id: number;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: VariantOption[];
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  discountedPrice: number | null;
  category: string;
  imageUrl: string | null;
  variantGroups: VariantGroup[];
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Community {
  id: number;
  name: string;
}

export interface CommunityAdmin {
  id: number;
  name: string;
  active: boolean;
  color: string;
}

export interface DeliveryAgentAdmin {
  id: number;
  name: string;
  phone: string;
  secretKey: string;
  active: boolean;
}

export interface VariantOptionAdmin {
  id: number;
  name: string;
  priceDelta: number;
  active: boolean;
  sortOrder: number;
}

export interface VariantGroupAdmin {
  id: number;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: VariantOptionAdmin[];
}

export interface MenuItemAdmin {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  discountedPrice: number | null;
  category: string;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  variantGroups: VariantGroupAdmin[];
}

export interface CartLineSelection {
  groupId: number;
  groupName: string;
  optionId: number;
  optionName: string;
  priceDelta: number;
}

export interface CartLine {
  lineId: string;
  menuItem: MenuItem;
  quantity: number;
  selections: CartLineSelection[];
  unitPrice: number;
}

export interface OrderItemResponse {
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selections: string[];
}

export interface DeliverySlot {
  id: number;
  label: string;
  startTime: string;   // "12:00:00" from java.time.LocalTime
  endTime: string;
  available: boolean;
  soldOut: boolean;
  unavailableReason: string | null;
}

export interface DeliverySlotAdmin {
  id: number;
  label: string;
  startTime: string;
  endTime: string;
  maxOrders: number | null;
  ordersToday: number;
  active: boolean;
  sortOrder: number;
}

export interface Expense {
  id: number;
  itemName: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  amount: number;
  spentOn: string;
  vendor: string | null;
  notes: string | null;
}

export interface ExpenseSummary {
  from: string | null;
  to: string | null;
  totalSpend: number;
  byCategory: { category: string; total: number }[];
  topItems: { itemName: string; total: number; purchases: number }[];
  expenses: Expense[];
}

export interface RestaurantInfo {
  name: string;
  phone: string;
  nameStyle: string | null;
  tagline: string | null;
  taglineStyle: string | null;
  heroImageUrl: string | null;
  eyebrowText: string | null;
  eyebrowStyle: string | null;
  showFeatureBadges: boolean;
  featureBadgesText: string | null;
  // Whether checkout should offer the express option, and the promise shown beside it.
  expressDeliveryEnabled: boolean;
  expressDeliveryMinutes: number;
  // How long each banner image is held before the slider advances, in milliseconds.
  heroRotationMs: number;
  // The kitchen's story, shown on /about. Null/blank hides the "Who we are" button.
  aboutUs: string | null;
  // Shown in the confirm-order dialog, above the total.
  orderConfirmMessage: string;
}

// Admin view of restaurant settings - identical to RestaurantInfo plus adminEmail,
// which the public /api/restaurant-info never returns.
export interface RestaurantSettingsAdmin extends RestaurantInfo {
  adminEmail: string | null;
  // SMTP, editable from the admin panel. The password is never returned - only whether one is set.
  mailHost: string | null;
  mailPort: number | null;
  mailUsername: string | null;
  mailFrom: string | null;
  mailPasswordSet: boolean;
}

// One image in the rotating banner at the top of the menu page. Public view - only
// enabled slides are returned. `id` is null for the legacy single hero image, which the
// backend serves as a one-slide list until real slides are configured.
export interface HeroSlide {
  id: number | null;
  imageUrl: string;
}

export interface HeroSlideAdmin {
  id: number;
  enabled: boolean;
  imageUrl: string;
  sortOrder: number;
}

// Public view - only enabled banners are ever returned, so there's no "enabled" field.
export interface PromoBanner {
  id: number;
  message: string;
}

export interface PromoBannerAdmin {
  id: number;
  enabled: boolean;
  message: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  orderCount: number;
  createdAt: string;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  communityId: number;
  communityName: string;
  tower: string;
  flatNumber: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface OrderResponse {
  id: number;
  customerName: string;
  customerPhone: string;
  communityName: string;
  communityColor: string;
  tower: string;
  flatNumber: string;
  notes: string | null;
  subtotalAmount: number;
  discountAmount: number;
  discountReason: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveryAgentId: number | null;
  deliveryAgentName: string | null;
  deliveryAgentPhone: string | null;
  // null for express orders and for orders placed before slots existed.
  deliverySlotLabel: string | null;
  deliverySlotWindow: string | null;
  expressDelivery: boolean;
  items: OrderItemResponse[];
}

// A customer asking to be called back about a weekly/monthly plan. Nothing is priced or
// scheduled here - the kitchen agrees bowls, timings and price on the call.
export type SubscriptionPlanType = "WEEKLY" | "MONTHLY";
export type SubscriptionStatus = "NEW" | "CONTACTED" | "CLOSED";

export interface SubscriptionRequest {
  id: number;
  customerName: string;
  phone: string;
  planType: SubscriptionPlanType;
  status: SubscriptionStatus;
  notes: string | null;
  createdAt: string;
}

// --- Coupons -------------------------------------------------------------------------------
export type CouponConditionType = "NONE" | "MIN_ORDER_TOTAL" | "MIN_CATEGORY_QUANTITY";

/** The template the kitchen defines; issuing one mints a Coupon against a phone number. */
export interface CouponType {
  id: number;
  name: string;
  discountAmount: number;
  conditionType: CouponConditionType;
  minOrderTotal: number | null;
  categoryName: string | null;
  minQuantity: number | null;
  validityDays: number;
  autoIssueOnDelivery: boolean;
  /** Master coupon: applies to any number of orders. Implies adminOnly. */
  reusable: boolean;
  /** Only the kitchen can apply it, from the order screen. */
  adminOnly: boolean;
  active: boolean;
  description: string;
}

/** An issued coupon, belonging to one phone number. */
export interface Coupon {
  id: number;
  code: string;
  /** Null for a master coupon, which belongs to nobody. */
  phone: string | null;
  name: string;
  discountAmount: number;
  description: string;
  issuedAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedOrderId: number | null;
  reusable: boolean;
  adminOnly: boolean;
  timesUsed: number;
  expired: boolean;
}

/** Always returned with HTTP 200 - a mistyped code is a normal outcome, not an error. */
export interface CouponValidationResult {
  valid: boolean;
  code: string;
  name: string | null;
  description: string | null;
  discountAmount: number | null;
  reason: string | null;
}
