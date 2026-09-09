package com.cloudkitchen.service;

import com.cloudkitchen.dto.HeroSlideAdminDto;
import com.cloudkitchen.dto.HeroSlideAdminRequest;
import com.cloudkitchen.dto.HeroSlideDto;
import com.cloudkitchen.entity.HeroSlide;
import com.cloudkitchen.repository.HeroSlideRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class HeroSlideService {

    private final HeroSlideRepository heroSlideRepository;
    private final RestaurantSettingsService restaurantSettingsService;

    public HeroSlideService(HeroSlideRepository heroSlideRepository,
                            RestaurantSettingsService restaurantSettingsService) {
        this.heroSlideRepository = heroSlideRepository;
        this.restaurantSettingsService = restaurantSettingsService;
    }

    /**
     * Public: the images the menu-page banner rotates through, in display order.
     *
     * <p>Falls back to the single {@code RestaurantSettings.heroImageUrl} when no slides are
     * enabled. That column predates this table and is still set in production, so without the
     * fallback the banner that is live today would vanish the moment this deploys and stay blank
     * until someone opened the admin page. With it, the existing image simply becomes slide one
     * of one, and the first slide the admin adds here takes over.
     *
     * <p>Read-only - nothing is copied into the new table, so switching back is just deleting
     * the slides.
     */
    @Transactional(readOnly = true)
    public List<HeroSlideDto> getActiveSlides() {
        List<HeroSlideDto> slides = heroSlideRepository.findByEnabledTrueOrderBySortOrderAscIdAsc().stream()
                .map(s -> new HeroSlideDto(s.getId(), s.getImageUrl()))
                .toList();
        if (!slides.isEmpty()) {
            return slides;
        }
        String legacy = restaurantSettingsService.getHeroImageUrl();
        return legacy == null || legacy.isBlank()
                ? List.of()
                : List.of(new HeroSlideDto(null, legacy));
    }

    @Transactional(readOnly = true)
    public List<HeroSlideAdminDto> getAllSlidesForAdmin() {
        return heroSlideRepository.findAllByOrderBySortOrderAscIdAsc().stream().map(this::toAdminDto).toList();
    }

    @Transactional
    public HeroSlideAdminDto createSlide(HeroSlideAdminRequest request) {
        HeroSlide slide = new HeroSlide();
        applyRequest(slide, request);
        return toAdminDto(heroSlideRepository.save(slide));
    }

    @Transactional
    public HeroSlideAdminDto updateSlide(Long id, HeroSlideAdminRequest request) {
        HeroSlide slide = heroSlideRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Banner slide not found"));
        applyRequest(slide, request);
        return toAdminDto(heroSlideRepository.save(slide));
    }

    // Real delete, as with promo banners - nothing references a slide by foreign key. The
    // uploaded file itself is left in place: other slides (or an old order's guide) may point
    // at the same upload, and orphaned images cost nothing but disk.
    @Transactional
    public void deleteSlide(Long id) {
        if (!heroSlideRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Banner slide not found");
        }
        heroSlideRepository.deleteById(id);
    }

    private void applyRequest(HeroSlide slide, HeroSlideAdminRequest request) {
        slide.setEnabled(request.isEnabled());
        slide.setImageUrl(request.getImageUrl().trim());
        slide.setSortOrder(request.getSortOrder());
    }

    private HeroSlideAdminDto toAdminDto(HeroSlide s) {
        return new HeroSlideAdminDto(s.getId(), s.isEnabled(), s.getImageUrl(), s.getSortOrder());
    }
}
