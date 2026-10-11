package com.cloudkitchen.service;

import com.cloudkitchen.dto.*;
import com.cloudkitchen.entity.Coupon;
import com.cloudkitchen.entity.CouponType;
import com.cloudkitchen.entity.MenuItem;
import com.cloudkitchen.repository.CouponRepository;
import com.cloudkitchen.repository.CouponTypeRepository;
import com.cloudkitchen.repository.MenuItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Issuing and redeeming coupons.
 *
 * <p>The important rule here is that {@link #evaluate} is the ONLY place that decides whether a
 * coupon applies, and it is called twice: once by the checkout page to preview the discount, and
 * again inside the order transaction before the money is committed. The preview is a convenience;
 * the second call is the one that counts. Anything else would let a customer post a cart that
 * never qualified, or reuse a code two tabs at a time.
 */
@Service
public class CouponService {

    private static final Logger log = LoggerFactory.getLogger(CouponService.class);

    /** No I/O/0/1 - these get read off a screen and typed by hand. */
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_BODY_LENGTH = 6;
    private static final int MAX_CODE_ATTEMPTS = 20;

    private final CouponRepository couponRepository;
    private final CouponTypeRepository couponTypeRepository;
    private final MenuItemRepository menuItemRepository;
    private final SecureRandom random = new SecureRandom();

    public CouponService(CouponRepository couponRepository,
                         CouponTypeRepository couponTypeRepository,
                         MenuItemRepository menuItemRepository) {
        this.couponRepository = couponRepository;
        this.couponTypeRepository = couponTypeRepository;
        this.menuItemRepository = menuItemRepository;
    }

    // ---------------------------------------------------------------- coupon types

    @Transactional(readOnly = true)
    public List<CouponTypeDto> getAllTypes() {
        return couponTypeRepository.findAllByOrderByIdAsc().stream().map(this::toTypeDto).toList();
    }

    @Transactional
    public CouponTypeDto createType(CouponTypeRequest request) {
        CouponType type = new CouponType();
        applyType(type, request);
        return toTypeDto(couponTypeRepository.save(type));
    }

    @Transactional
    public CouponTypeDto updateType(Long id, CouponTypeRequest request) {
        CouponType type = couponTypeRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon type not found"));
        applyType(type, request);
        return toTypeDto(couponTypeRepository.save(type));
    }

    @Transactional
    public void deleteType(Long id) {
        if (!couponTypeRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon type not found");
        }
        // Issued coupons keep working: they snapshot their rules and only hold a nullable
        // reference back to the type, so deleting the template cannot void someone's coupon.
        couponRepository.findAllByOrderByIssuedAtDesc().stream()
                .filter(c -> c.getCouponType() != null && id.equals(c.getCouponType().getId()))
                .forEach(c -> { c.setCouponType(null); couponRepository.save(c); });
        couponTypeRepository.deleteById(id);
    }

    private void applyType(CouponType type, CouponTypeRequest request) {
        CouponType.ConditionType condition = request.getConditionType();
        // Reject a condition with nothing to compare against, rather than storing a rule that
        // silently never matches (or always does).
        if (condition == CouponType.ConditionType.MIN_ORDER_TOTAL
                && (request.getMinOrderTotal() == null || request.getMinOrderTotal().signum() <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A minimum-bill coupon needs a bill amount");
        }
        if (condition == CouponType.ConditionType.MIN_CATEGORY_QUANTITY
                && (request.getCategoryName() == null || request.getCategoryName().isBlank()
                    || request.getMinQuantity() == null || request.getMinQuantity() < 1)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A category coupon needs a category and a quantity");
        }
        type.setName(request.getName().trim());
        type.setDiscountAmount(request.getDiscountAmount());
        type.setConditionType(condition);
        type.setMinOrderTotal(condition == CouponType.ConditionType.MIN_ORDER_TOTAL ? request.getMinOrderTotal() : null);
        type.setCategoryName(condition == CouponType.ConditionType.MIN_CATEGORY_QUANTITY
                ? request.getCategoryName().trim() : null);
        type.setMinQuantity(condition == CouponType.ConditionType.MIN_CATEGORY_QUANTITY ? request.getMinQuantity() : null);
        type.setValidityDays(request.getValidityDays());
        type.setAutoIssueOnDelivery(request.isAutoIssueOnDelivery());
        type.setReusable(request.isReusable());
        // A reusable code a customer could type would discount every order once it leaked, so
        // reusable implies admin-only. Enforced here rather than trusted from the form.
        type.setAdminOnly(request.isAdminOnly() || request.isReusable());
        if (request.getActive() != null) {
            type.setActive(request.getActive());
        }
    }

    // ---------------------------------------------------------------- issuing

    @Transactional
    public CouponDto issueManually(IssueCouponRequest request) {
        CouponType type = couponTypeRepository.findById(request.getCouponTypeId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon type not found"));
        String phone = request.getPhone() == null ? "" : request.getPhone().trim();
        // A master coupon belongs to nobody; a customer coupon must say whose it is.
        if (type.isReusable()) {
            return toCouponDto(issue(type, null));
        }
        if (phone.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A customer coupon needs a phone number");
        }
        return toCouponDto(issue(type, phone));
    }

    /**
     * Mints a coupon of every type flagged autoIssueOnDelivery. Called when an order is
     * delivered - see OrderService.updateStatus.
     *
     * <p>Never throws: a coupon failing to mint must not roll back a delivery.
     */
    @Transactional
    public void issueForDeliveredOrder(String phone) {
        if (phone == null || phone.isBlank()) {
            return;
        }
        for (CouponType type : couponTypeRepository.findByActiveTrueAndAutoIssueOnDeliveryTrue()) {
            try {
                Coupon coupon = issue(type, phone.trim());
                log.info("Auto-issued coupon {} ({}) to {}", coupon.getCode(), type.getName(), phone);
            } catch (Exception e) {
                log.warn("Could not auto-issue coupon type {}: {}", type.getId(), e.getMessage());
            }
        }
    }

    private Coupon issue(CouponType type, String phone) {
        Coupon coupon = new Coupon();
        coupon.setCode(generateUniqueCode());
        coupon.setPhone(phone);
        coupon.setCouponType(type);
        // Snapshot - see the note on the Coupon entity.
        coupon.setName(type.getName());
        coupon.setDiscountAmount(type.getDiscountAmount());
        coupon.setConditionType(type.getConditionType());
        coupon.setMinOrderTotal(type.getMinOrderTotal());
        coupon.setCategoryName(type.getCategoryName());
        coupon.setMinQuantity(type.getMinQuantity());
        coupon.setReusable(type.isReusable());
        coupon.setAdminOnly(type.isAdminOnly());
        coupon.setIssuedAt(Instant.now());
        coupon.setExpiresAt(Instant.now().plus(type.getValidityDays(), ChronoUnit.DAYS));
        return couponRepository.save(coupon);
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            StringBuilder sb = new StringBuilder("GB");
            for (int i = 0; i < CODE_BODY_LENGTH; i++) {
                sb.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
            }
            String code = sb.toString();
            if (!couponRepository.existsByCode(code)) {
                return code;
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Could not generate a unique coupon code");
    }

    // ---------------------------------------------------------------- validation

    /** Preview for the checkout page. Resolves the cart from the database, never from the client. */
    @Transactional(readOnly = true)
    public CouponValidationResult validate(CouponValidationRequest request) {
        String code = request.getCode() == null ? "" : request.getCode().trim();
        BigDecimal subtotal = BigDecimal.ZERO;
        Map<String, Integer> quantityByCategory = new java.util.HashMap<>();

        if (request.getItems() != null) {
            for (CouponValidationRequest.CartLine line : request.getItems()) {
                Optional<MenuItem> found = menuItemRepository.findById(line.getMenuItemId());
                if (found.isEmpty()) {
                    continue;
                }
                MenuItem item = found.get();
                int qty = Math.max(1, line.getQuantity());
                BigDecimal unit = item.getDiscountedPrice() != null ? item.getDiscountedPrice() : item.getBasePrice();
                subtotal = subtotal.add(unit.multiply(BigDecimal.valueOf(qty)));
                quantityByCategory.merge(item.getCategory(), qty, Integer::sum);
            }
        }
        return evaluate(code, request.getPhone(), subtotal, quantityByCategory);
    }

    /**
     * The single rule engine. Returns why a code cannot be used rather than throwing, because
     * "you need one more salad" is information the customer should see.
     *
     * @param quantityByCategory item counts per MenuItem.category, already resolved server-side
     */
    /** Customer path: admin-only codes are refused and the phone must match. */
    @Transactional(readOnly = true)
    public CouponValidationResult evaluate(String code, String phone, BigDecimal subtotal,
                                           Map<String, Integer> quantityByCategory) {
        return evaluate(code, phone, subtotal, quantityByCategory, false);
    }

    /**
     * @param byAdmin true when the kitchen is applying it from the order screen, which permits
     *                admin-only codes and skips the phone-ownership check
     */
    @Transactional(readOnly = true)
    public CouponValidationResult evaluate(String code, String phone, BigDecimal subtotal,
                                           Map<String, Integer> quantityByCategory, boolean byAdmin) {
        if (code == null || code.isBlank()) {
            return CouponValidationResult.rejected(code, "Enter a coupon code");
        }
        Optional<Coupon> found = couponRepository.findByCodeIgnoreCase(code.trim());
        if (found.isEmpty()) {
            return CouponValidationResult.rejected(code, "That coupon code is not valid");
        }
        Coupon coupon = found.get();

        // An admin-only code typed at customer checkout is refused, and refused with the SAME
        // wording as an unknown code - confirming a master code exists is exactly the hint
        // someone needs to start sharing it.
        if (coupon.isAdminOnly() && !byAdmin) {
            return CouponValidationResult.rejected(code, "That coupon code is not valid");
        }
        // Ownership only applies to a coupon that belongs to someone. A master coupon has no
        // phone, and the kitchen applying a code is not claiming to be the customer.
        if (coupon.getPhone() != null && !byAdmin
                && !digitsOf(coupon.getPhone()).equals(digitsOf(phone))) {
            return CouponValidationResult.rejected(code, "That coupon code is not valid");
        }
        if (coupon.isUsed()) {
            return CouponValidationResult.rejected(code, "This coupon has already been used");
        }
        if (coupon.isExpired()) {
            return CouponValidationResult.rejected(code, "This coupon has expired");
        }

        switch (coupon.getConditionType()) {
            case MIN_ORDER_TOTAL -> {
                BigDecimal required = coupon.getMinOrderTotal() == null ? BigDecimal.ZERO : coupon.getMinOrderTotal();
                if (subtotal.compareTo(required) < 0) {
                    return CouponValidationResult.rejected(code,
                            "Spend at least Rs " + required.stripTrailingZeros().toPlainString() + " to use this coupon");
                }
            }
            case MIN_CATEGORY_QUANTITY -> {
                int required = coupon.getMinQuantity() == null ? 1 : coupon.getMinQuantity();
                int have = quantityByCategory.getOrDefault(coupon.getCategoryName(), 0);
                if (have < required) {
                    return CouponValidationResult.rejected(code,
                            "Add " + (required - have) + " more from " + coupon.getCategoryName() + " to use this coupon");
                }
            }
            case NONE -> { }
        }

        // Never discount more than the bill - a Rs 50 coupon on a Rs 30 order makes it free,
        // not negative.
        BigDecimal discount = coupon.getDiscountAmount().min(subtotal);
        return new CouponValidationResult(true, coupon.getCode(), coupon.getName(),
                describe(coupon.getConditionType(), coupon.getMinOrderTotal(), coupon.getCategoryName(),
                        coupon.getMinQuantity(), coupon.getDiscountAmount()),
                discount, null);
    }

    /** Marks a coupon spent. Called inside the order transaction, after the money is decided. */
    /**
     * Records a redemption. A reusable coupon is counted but never consumed - its usedAt is kept
     * as "last applied" rather than "spent", which is why isUsed() ignores it for those.
     */
    @Transactional
    public void markUsed(String code, Long orderId) {
        couponRepository.findByCodeIgnoreCase(code).ifPresent(coupon -> {
            coupon.setUsedAt(Instant.now());
            coupon.setUsedOrderId(orderId);
            coupon.setTimesUsed(coupon.getTimesUsed() + 1);
            couponRepository.save(coupon);
        });
    }

    // ---------------------------------------------------------------- admin reads

    @Transactional(readOnly = true)
    public List<CouponDto> getAllCoupons() {
        return couponRepository.findAllByOrderByIssuedAtDesc().stream().map(this::toCouponDto).toList();
    }

    /**
     * Look up a single coupon by its code, for an admin checking one a customer has quoted.
     *
     * <p>Unlike the customer-facing validate, this takes no cart: the admin wants to know whose
     * it is, whether it is still live and what the condition is - not whether one particular
     * basket qualifies. Returns an empty list rather than 404 so the caller can say "no such
     * code" without special-casing an error status.
     */
    @Transactional(readOnly = true)
    public List<CouponDto> findByCode(String code) {
        if (code == null || code.isBlank()) {
            return List.of();
        }
        return couponRepository.findByCodeIgnoreCase(code.trim())
                .map(c -> List.of(toCouponDto(c)))
                .orElse(List.of());
    }

    @Transactional(readOnly = true)
    public List<CouponDto> getCouponsForPhone(String phone) {
        return couponRepository.findByPhoneOrderByIssuedAtDesc(phone).stream().map(this::toCouponDto).toList();
    }

    @Transactional
    public void deleteCoupon(Long id) {
        if (!couponRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found");
        }
        couponRepository.deleteById(id);
    }

    // ---------------------------------------------------------------- helpers

    /** Compares numbers by digits only, so "+91 99868 63519" matches "9986863519". */
    private static String digitsOf(String phone) {
        if (phone == null) {
            return "";
        }
        String digits = phone.replaceAll("\\D", "");
        return digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
    }

    private static String describe(CouponType.ConditionType condition, BigDecimal minTotal,
                                   String category, Integer minQuantity, BigDecimal discount) {
        String off = "Rs " + discount.stripTrailingZeros().toPlainString() + " off";
        return switch (condition) {
            case MIN_ORDER_TOTAL -> off + " on bills of Rs "
                    + (minTotal == null ? "0" : minTotal.stripTrailingZeros().toPlainString()) + " or more";
            case MIN_CATEGORY_QUANTITY -> off + " when you buy " + (minQuantity == null ? 1 : minQuantity)
                    + " or more from " + category;
            case NONE -> off + " on any order";
        };
    }

    private CouponTypeDto toTypeDto(CouponType t) {
        return new CouponTypeDto(t.getId(), t.getName(), t.getDiscountAmount(), t.getConditionType(),
                t.getMinOrderTotal(), t.getCategoryName(), t.getMinQuantity(), t.getValidityDays(),
                t.isAutoIssueOnDelivery(), t.isReusable(), t.isAdminOnly(), t.isActive(),
                describe(t.getConditionType(), t.getMinOrderTotal(), t.getCategoryName(),
                        t.getMinQuantity(), t.getDiscountAmount()));
    }

    private CouponDto toCouponDto(Coupon c) {
        return new CouponDto(c.getId(), c.getCode(), c.getPhone(), c.getName(), c.getDiscountAmount(),
                describe(c.getConditionType(), c.getMinOrderTotal(), c.getCategoryName(),
                        c.getMinQuantity(), c.getDiscountAmount()),
                c.getIssuedAt(), c.getExpiresAt(), c.getUsedAt(), c.getUsedOrderId(),
                c.isReusable(), c.isAdminOnly(), c.getTimesUsed(), c.isExpired());
    }
}
