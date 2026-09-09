package com.cloudkitchen.controller;

import com.cloudkitchen.dto.CategoryDto;
import com.cloudkitchen.dto.CommunityDto;
import com.cloudkitchen.dto.HeroSlideDto;
import com.cloudkitchen.dto.MenuItemDto;
import com.cloudkitchen.dto.PromoBannerDto;
import com.cloudkitchen.dto.RestaurantInfoDto;
import com.cloudkitchen.service.CategoryService;
import com.cloudkitchen.service.HeroSlideService;
import com.cloudkitchen.service.MenuService;
import com.cloudkitchen.service.PromoBannerService;
import com.cloudkitchen.service.RestaurantSettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MenuController {

    private final MenuService menuService;
    private final PromoBannerService promoBannerService;
    private final RestaurantSettingsService restaurantSettingsService;
    private final CategoryService categoryService;
    private final HeroSlideService heroSlideService;

    public MenuController(MenuService menuService, PromoBannerService promoBannerService,
                           RestaurantSettingsService restaurantSettingsService, CategoryService categoryService,
                           HeroSlideService heroSlideService) {
        this.menuService = menuService;
        this.promoBannerService = promoBannerService;
        this.restaurantSettingsService = restaurantSettingsService;
        this.categoryService = categoryService;
        this.heroSlideService = heroSlideService;
    }

    @GetMapping("/menu")
    public List<MenuItemDto> getMenu() {
        return menuService.getActiveMenu();
    }

    @GetMapping("/categories")
    public List<CategoryDto> getCategories() {
        return categoryService.getAllCategories();
    }

    @GetMapping("/communities")
    public List<CommunityDto> getCommunities() {
        return menuService.getActiveCommunities();
    }

    @GetMapping("/restaurant-info")
    public RestaurantInfoDto getRestaurantInfo() {
        return restaurantSettingsService.getSettings();
    }

    // The images the menu-page banner rotates through, in display order. Falls back to the
    // legacy single hero image when no slides are configured - see HeroSlideService.
    @GetMapping("/hero-slides")
    public List<HeroSlideDto> getHeroSlides() {
        return heroSlideService.getActiveSlides();
    }

    // Every enabled banner - any number can run at once.
    @GetMapping("/promo-banners")
    public List<PromoBannerDto> getPromoBanners() {
        return promoBannerService.getActiveBanners();
    }
}
