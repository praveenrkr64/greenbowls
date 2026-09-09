package com.cloudkitchen.service;

import com.cloudkitchen.dto.RestaurantInfoDto;
import com.cloudkitchen.dto.RestaurantSettingsAdminDto;
import com.cloudkitchen.dto.RestaurantSettingsAdminRequest;
import com.cloudkitchen.entity.RestaurantSettings;
import com.cloudkitchen.repository.RestaurantSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RestaurantSettingsService {

    /** Used until an admin writes their own. */
    private static final String DEFAULT_CONFIRM_MESSAGE =
            "We will call you shortly to confirm this order before we start cooking.";

    /** The "20 minute delivery" of the feature name, used until an admin sets otherwise. */
    private static final int DEFAULT_EXPRESS_MINUTES = 20;

    /** Banner rotation interval, used until an admin sets one. Matches the old hard-coded value. */
    private static final int DEFAULT_HERO_ROTATION_MS = 5000;

    private final RestaurantSettingsRepository restaurantSettingsRepository;

    // Fallback defaults until an admin saves real settings for the first time.
    @Value("${app.restaurant.name:Sprout & Bowl}")
    private String defaultName;

    @Value("${app.restaurant.phone:+91 98765 43210}")
    private String defaultPhone;

    @Value("${app.restaurant.tagline:Build your bowl. Pick your sprouts, your protein, your rice - delivered fresh to your door.}")
    private String defaultTagline;

    @Value("${app.restaurant.eyebrow-text:Fresh - High-protein - Made to order}")
    private String defaultEyebrowText;

    @Value("${app.restaurant.feature-badges:High Protein, 100% Natural, No Preservatives}")
    private String defaultFeatureBadgesText;

    @Value("${app.admin.notification-email:}")
    private String defaultAdminEmail;

    public RestaurantSettingsService(RestaurantSettingsRepository restaurantSettingsRepository) {
        this.restaurantSettingsRepository = restaurantSettingsRepository;
    }

    // Public: never includes adminEmail - see RestaurantSettingsAdminDto for the
    // admin-only view that does.
    @Transactional(readOnly = true)
    public RestaurantInfoDto getSettings() {
        return restaurantSettingsRepository.findById(RestaurantSettings.SINGLETON_ID)
                .map(this::toDto)
                .orElse(new RestaurantInfoDto(defaultName, defaultPhone, null, defaultTagline, null, null,
                        defaultEyebrowText, null, false, defaultFeatureBadgesText,
                        false, DEFAULT_EXPRESS_MINUTES, DEFAULT_HERO_ROTATION_MS, null, DEFAULT_CONFIRM_MESSAGE));
    }

    @Transactional(readOnly = true)
    public RestaurantSettingsAdminDto getSettingsForAdmin() {
        return restaurantSettingsRepository.findById(RestaurantSettings.SINGLETON_ID)
                .map(this::toAdminDto)
                .orElse(new RestaurantSettingsAdminDto(
                        defaultName, defaultPhone, null, defaultTagline, null, null, defaultEyebrowText, null,
                        false, defaultFeatureBadgesText, defaultAdminEmail,
                        false, DEFAULT_EXPRESS_MINUTES, DEFAULT_HERO_ROTATION_MS, null, DEFAULT_CONFIRM_MESSAGE
                ));
    }

    // Used by EmailNotificationService - a single string, not the full settings object,
    // since that's all a notification send needs.
    @Transactional(readOnly = true)
    public String getAdminNotificationEmail() {
        return restaurantSettingsRepository.findById(RestaurantSettings.SINGLETON_ID)
                .map(RestaurantSettings::getAdminEmail)
                .filter(email -> email != null && !email.isBlank())
                .orElse(defaultAdminEmail);
    }

    /**
     * Whether express ("20 minute") delivery is currently offered.
     *
     * <p>Read at order time rather than trusted from the request: a browser tab opened before
     * the kitchen switched express off would otherwise still be able to place one.
     */
    /** The kitchen's display name, used in push and email copy. */
    @Transactional(readOnly = true)
    public String getRestaurantName() {
        return restaurantSettingsRepository.findById(RestaurantSettings.SINGLETON_ID)
                .map(RestaurantSettings::getName)
                .filter(n -> n != null && !n.isBlank())
                .orElse(defaultName);
    }

    /**
     * The legacy single banner image. Used only as HeroSlideService's fallback when no
     * hero slides are configured, so the image live in production today keeps showing.
     */
    @Transactional(readOnly = true)
    public String getHeroImageUrl() {
        return restaurantSettingsRepository.findById(RestaurantSettings.SINGLETON_ID)
                .map(RestaurantSettings::getHeroImageUrl)
                .filter(url -> url != null && !url.isBlank())
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean isExpressDeliveryEnabled() {
        return restaurantSettingsRepository.findById(RestaurantSettings.SINGLETON_ID)
                .map(s -> Boolean.TRUE.equals(s.getExpressDeliveryEnabled()))
                .orElse(false);   // no settings row yet means the kitchen never switched it on
    }

    /** Minutes promised for express delivery; 20 unless the admin has changed it. */
    @Transactional(readOnly = true)
    public int getExpressDeliveryMinutes() {
        return restaurantSettingsRepository.findById(RestaurantSettings.SINGLETON_ID)
                .map(RestaurantSettings::getExpressDeliveryMinutes)
                .filter(m -> m != null && m > 0)
                .orElse(DEFAULT_EXPRESS_MINUTES);
    }

    @Transactional
    public RestaurantSettingsAdminDto updateSettings(RestaurantSettingsAdminRequest request) {
        RestaurantSettings settings = restaurantSettingsRepository.findById(RestaurantSettings.SINGLETON_ID)
                .orElseGet(RestaurantSettings::new);
        settings.setName(request.getName());
        settings.setPhone(request.getPhone());
        settings.setNameStyle(blankToNull(request.getNameStyle()));
        settings.setTagline(blankToNull(request.getTagline()));
        settings.setTaglineStyle(blankToNull(request.getTaglineStyle()));
        settings.setHeroImageUrl(blankToNull(request.getHeroImageUrl()));
        settings.setEyebrowText(blankToNull(request.getEyebrowText()));
        settings.setEyebrowStyle(blankToNull(request.getEyebrowStyle()));
        settings.setShowFeatureBadges(request.isShowFeatureBadges());
        settings.setFeatureBadgesText(blankToNull(request.getFeatureBadgesText()));
        settings.setAdminEmail(blankToNull(request.getAdminEmail()));
        // Only overwritten when the admin actually sent a value -- a partial update from an
        // older client must not silently switch express delivery off.
        if (request.getExpressDeliveryEnabled() != null) {
            settings.setExpressDeliveryEnabled(request.getExpressDeliveryEnabled());
        }
        // Null means "not sent" (the banner card posts settings without this field); an empty
        // string means "clear it", which blankToNull turns back into null.
        if (request.getAboutUs() != null) {
            settings.setAboutUs(blankToNull(request.getAboutUs()));
        }
        if (request.getOrderConfirmMessage() != null) {
            settings.setOrderConfirmMessage(blankToNull(request.getOrderConfirmMessage()));
        }
        if (request.getExpressDeliveryMinutes() != null) {
            settings.setExpressDeliveryMinutes(request.getExpressDeliveryMinutes());
        }
        // Null means "not sent", not "reset". The Restaurant details form posts the whole settings
        // object without this field, so without the guard saving a phone number would silently
        // reset the banner speed.
        if (request.getHeroRotationMs() != null) {
            settings.setHeroRotationMs(request.getHeroRotationMs());
        }
        RestaurantSettings saved = restaurantSettingsRepository.save(settings);
        return toAdminDto(saved);
    }

    private RestaurantInfoDto toDto(RestaurantSettings s) {
        return new RestaurantInfoDto(
                s.getName(), s.getPhone(), s.getNameStyle(),
                s.getTagline() != null ? s.getTagline() : defaultTagline, s.getTaglineStyle(),
                s.getHeroImageUrl(),
                s.getEyebrowText() != null ? s.getEyebrowText() : defaultEyebrowText, s.getEyebrowStyle(),
                Boolean.TRUE.equals(s.getShowFeatureBadges()),
                s.getFeatureBadgesText() != null ? s.getFeatureBadgesText() : defaultFeatureBadgesText,
                Boolean.TRUE.equals(s.getExpressDeliveryEnabled()),
                s.getExpressDeliveryMinutes() != null && s.getExpressDeliveryMinutes() > 0
                        ? s.getExpressDeliveryMinutes() : DEFAULT_EXPRESS_MINUTES,
                s.getHeroRotationMs() != null && s.getHeroRotationMs() > 0
                        ? s.getHeroRotationMs() : DEFAULT_HERO_ROTATION_MS,
                s.getAboutUs(),
                s.getOrderConfirmMessage() != null && !s.getOrderConfirmMessage().isBlank()
                        ? s.getOrderConfirmMessage() : DEFAULT_CONFIRM_MESSAGE
        );
    }

    private RestaurantSettingsAdminDto toAdminDto(RestaurantSettings s) {
        return new RestaurantSettingsAdminDto(
                s.getName(), s.getPhone(), s.getNameStyle(),
                s.getTagline() != null ? s.getTagline() : defaultTagline, s.getTaglineStyle(),
                s.getHeroImageUrl(),
                s.getEyebrowText() != null ? s.getEyebrowText() : defaultEyebrowText, s.getEyebrowStyle(),
                Boolean.TRUE.equals(s.getShowFeatureBadges()),
                s.getFeatureBadgesText() != null ? s.getFeatureBadgesText() : defaultFeatureBadgesText,
                s.getAdminEmail() != null ? s.getAdminEmail() : defaultAdminEmail,
                Boolean.TRUE.equals(s.getExpressDeliveryEnabled()),
                s.getExpressDeliveryMinutes() != null && s.getExpressDeliveryMinutes() > 0
                        ? s.getExpressDeliveryMinutes() : DEFAULT_EXPRESS_MINUTES,
                s.getHeroRotationMs() != null && s.getHeroRotationMs() > 0
                        ? s.getHeroRotationMs() : DEFAULT_HERO_ROTATION_MS,
                s.getAboutUs(),
                s.getOrderConfirmMessage() != null && !s.getOrderConfirmMessage().isBlank()
                        ? s.getOrderConfirmMessage() : DEFAULT_CONFIRM_MESSAGE
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
