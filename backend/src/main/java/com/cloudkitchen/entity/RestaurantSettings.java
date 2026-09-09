package com.cloudkitchen.entity;

import jakarta.persistence.*;

// Single site-wide row (always id=1) - the restaurant's display name, contact phone,
// and an optional raw CSS style string applied to the name on the customer menu page.
@Entity
@Table(name = "restaurant_settings")
public class RestaurantSettings {

    public static final Long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    // Raw CSS declarations, e.g. "color: #ff6b35; font-style: italic;" - applied
    // inline to the restaurant name on the customer menu page.
    @Column(length = 500)
    private String nameStyle;

    // The line shown under the name, e.g. "Build your bowl...". Null means use the
    // hardcoded default copy. If heroImageUrl is set, the hero image is shown
    // instead of this text on the customer menu page.
    @Column(length = 300)
    private String tagline;

    @Column(length = 500)
    private String taglineStyle;

    // Optional hero image - when set, replaces the tagline text in the hero section.
    @Column(length = 1000)
    private String heroImageUrl;

    // The small uppercase eyebrow line above the hero headline, e.g.
    // "Fresh - High-protein - Made to order". Null means use the hardcoded default.
    @Column(length = 200)
    private String eyebrowText;

    @Column(length = 500)
    private String eyebrowStyle;

    // Whether to show the "High Protein / 100% Natural / No Preservatives" badge row
    // below the hero image/tagline. Nullable in the DB, same as the other optional
    // settings above - null means hidden (the default), only shown once an admin
    // explicitly turns it on.
    private Boolean showFeatureBadges;

    // Comma-separated badge labels, e.g. "High Protein, 100% Natural, No
    // Preservatives" - null means use the hardcoded default copy, same pattern as
    // tagline/eyebrowText above.
    @Column(length = 300)
    private String featureBadgesText;

    // Where "new order" and "order delivered" notification emails go. Deliberately
    // never exposed via the public RestaurantInfoDto (unlike every other field above) -
    // this is the one setting that must stay admin-only, see RestaurantSettingsAdminDto.
    @Column(length = 200)
    private String adminEmail;

    // The "20 minute delivery" switch. When off, checkout offers only the configured slots;
    // when on, an Express option appears alongside them and bypasses slot selection.
    private Boolean expressDeliveryEnabled;

    // Shown next to the express option so the promise can change without a deploy.
    private Integer expressDeliveryMinutes;

    // How long each banner image is held before the slider advances, in milliseconds.
    // Nullable on purpose: a NOT NULL column cannot be added to an already-populated table by
    // ddl-auto=update (that is what broke the express_delivery migration), and null simply means
    // "use the default" - see RestaurantSettingsService.DEFAULT_HERO_ROTATION_MS.
    private Integer heroRotationMs;

    // The kitchen's own story, shown on /about behind the "Who we are" button. Free text the
    // owner writes; blank means the button is not shown at all, rather than linking to an empty
    // page. Nullable and generously sized - it is prose, not a label.
    @Column(length = 4000)
    private String aboutUs;

    // Shown in the confirm-order dialog, above the cart total. Configurable because what the
    // kitchen wants to promise at that moment ("we will call to confirm", payment terms,
    // cut-off times) changes without warning and should not need a deploy.
    @Column(length = 500)
    private String orderConfirmMessage;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getNameStyle() { return nameStyle; }
    public void setNameStyle(String nameStyle) { this.nameStyle = nameStyle; }

    public String getTagline() { return tagline; }
    public void setTagline(String tagline) { this.tagline = tagline; }

    public String getTaglineStyle() { return taglineStyle; }
    public void setTaglineStyle(String taglineStyle) { this.taglineStyle = taglineStyle; }

    public String getHeroImageUrl() { return heroImageUrl; }
    public void setHeroImageUrl(String heroImageUrl) { this.heroImageUrl = heroImageUrl; }

    public String getEyebrowText() { return eyebrowText; }
    public void setEyebrowText(String eyebrowText) { this.eyebrowText = eyebrowText; }

    public String getEyebrowStyle() { return eyebrowStyle; }
    public void setEyebrowStyle(String eyebrowStyle) { this.eyebrowStyle = eyebrowStyle; }

    public Boolean getShowFeatureBadges() { return showFeatureBadges; }
    public void setShowFeatureBadges(Boolean showFeatureBadges) { this.showFeatureBadges = showFeatureBadges; }

    public String getFeatureBadgesText() { return featureBadgesText; }
    public void setFeatureBadgesText(String featureBadgesText) { this.featureBadgesText = featureBadgesText; }

    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }

    public Boolean getExpressDeliveryEnabled() { return expressDeliveryEnabled; }
    public void setExpressDeliveryEnabled(Boolean expressDeliveryEnabled) { this.expressDeliveryEnabled = expressDeliveryEnabled; }

    public Integer getExpressDeliveryMinutes() { return expressDeliveryMinutes; }
    public void setExpressDeliveryMinutes(Integer expressDeliveryMinutes) { this.expressDeliveryMinutes = expressDeliveryMinutes; }

    public Integer getHeroRotationMs() { return heroRotationMs; }
    public void setHeroRotationMs(Integer heroRotationMs) { this.heroRotationMs = heroRotationMs; }

    public String getAboutUs() { return aboutUs; }
    public void setAboutUs(String aboutUs) { this.aboutUs = aboutUs; }

    public String getOrderConfirmMessage() { return orderConfirmMessage; }
    public void setOrderConfirmMessage(String orderConfirmMessage) { this.orderConfirmMessage = orderConfirmMessage; }
}
