package com.cloudkitchen.controller;

import com.cloudkitchen.dto.*;
import com.cloudkitchen.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Validating a coupon is PUBLIC - the customer needs it at checkout. Everything that creates or
 * reads coupons is admin-only: the issued list is effectively a customer list with discounts
 * attached.
 */
@RestController
@RequestMapping("/api")
public class CouponController {

    private final CouponService couponService;

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    private void requireAdmin(String providedKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(providedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
    }

    // ---- public ----

    @PostMapping("/coupons/validate")
    public CouponValidationResult validate(@Valid @RequestBody CouponValidationRequest request) {
        return couponService.validate(request);
    }

    // ---- admin: coupon types ----

    @GetMapping("/admin/coupon-types")
    public List<CouponTypeDto> listTypes(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        requireAdmin(key);
        return couponService.getAllTypes();
    }

    @PostMapping("/admin/coupon-types")
    @ResponseStatus(HttpStatus.CREATED)
    public CouponTypeDto createType(@Valid @RequestBody CouponTypeRequest request,
                                     @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        requireAdmin(key);
        return couponService.createType(request);
    }

    @PutMapping("/admin/coupon-types/{id}")
    public CouponTypeDto updateType(@PathVariable Long id, @Valid @RequestBody CouponTypeRequest request,
                                     @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        requireAdmin(key);
        return couponService.updateType(id, request);
    }

    @DeleteMapping("/admin/coupon-types/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteType(@PathVariable Long id,
                           @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        requireAdmin(key);
        couponService.deleteType(id);
    }

    // ---- admin: issued coupons ----

    @GetMapping("/admin/coupons")
    public List<CouponDto> listCoupons(@RequestParam(required = false) String phone,
                                        @RequestParam(required = false) String code,
                                        @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        requireAdmin(key);
        if (code != null && !code.isBlank()) {
            return couponService.findByCode(code);
        }
        return phone == null || phone.isBlank()
                ? couponService.getAllCoupons()
                : couponService.getCouponsForPhone(phone);
    }

    @PostMapping("/admin/coupons")
    @ResponseStatus(HttpStatus.CREATED)
    public CouponDto issue(@Valid @RequestBody IssueCouponRequest request,
                           @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        requireAdmin(key);
        return couponService.issueManually(request);
    }

    @DeleteMapping("/admin/coupons/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCoupon(@PathVariable Long id,
                             @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        requireAdmin(key);
        couponService.deleteCoupon(id);
    }
}
