package com.cloudkitchen.service;

import com.cloudkitchen.dto.PromoBannerAdminDto;
import com.cloudkitchen.dto.PromoBannerAdminRequest;
import com.cloudkitchen.dto.PromoBannerDto;
import com.cloudkitchen.entity.PromoBanner;
import com.cloudkitchen.repository.PromoBannerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PromoBannerService {

    private final PromoBannerRepository promoBannerRepository;

    public PromoBannerService(PromoBannerRepository promoBannerRepository) {
        this.promoBannerRepository = promoBannerRepository;
    }

    // Public: every enabled banner, shown above the customer menu - any number can run
    // at once (e.g. two separate offers), unlike the old single site-wide banner.
    @Transactional(readOnly = true)
    public List<PromoBannerDto> getActiveBanners() {
        return promoBannerRepository.findByEnabledTrueOrderByIdAsc().stream()
                .map(b -> new PromoBannerDto(b.getId(), b.getMessage()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PromoBannerAdminDto> getAllBannersForAdmin() {
        return promoBannerRepository.findAllByOrderByIdAsc().stream().map(this::toAdminDto).toList();
    }

    @Transactional
    public PromoBannerAdminDto createBanner(PromoBannerAdminRequest request) {
        PromoBanner banner = new PromoBanner();
        applyRequest(banner, request);
        return toAdminDto(promoBannerRepository.save(banner));
    }

    @Transactional
    public PromoBannerAdminDto updateBanner(Long id, PromoBannerAdminRequest request) {
        PromoBanner banner = promoBannerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Promotion banner not found"));
        applyRequest(banner, request);
        return toAdminDto(promoBannerRepository.save(banner));
    }

    // Real delete, not soft-delete - unlike menu items/communities, nothing else
    // references a promo banner by foreign key, so there's no order-history reason
    // to keep a deleted one around.
    @Transactional
    public void deleteBanner(Long id) {
        if (!promoBannerRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Promotion banner not found");
        }
        promoBannerRepository.deleteById(id);
    }

    private void applyRequest(PromoBanner banner, PromoBannerAdminRequest request) {
        banner.setEnabled(request.isEnabled());
        banner.setMessage(request.getMessage().trim());
    }

    private PromoBannerAdminDto toAdminDto(PromoBanner b) {
        return new PromoBannerAdminDto(b.getId(), b.isEnabled(), b.getMessage());
    }
}
