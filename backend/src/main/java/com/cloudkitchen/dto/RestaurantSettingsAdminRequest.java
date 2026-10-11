package com.cloudkitchen.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;

public class RestaurantSettingsAdminRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String phone;

    // Raw CSS declarations, e.g. "color: #ff6b35; font-weight: 800;" - optional.
    private String nameStyle;

    private String tagline;

    private String taglineStyle;

    // Optional - when set, shown instead of the tagline text on the customer menu page.
    private String heroImageUrl;

    private String eyebrowText;

    private String eyebrowStyle;

    private boolean showFeatureBadges = false;

    private String featureBadgesText;

    // Where "new order" / "order delivered" notification emails go.
    private String adminEmail;
    // The 20-minute delivery switch and the promise shown beside it.
    private Boolean expressDeliveryEnabled;

    private Integer expressDeliveryMinutes;

    // Floor of 500ms is a safety limit, not taste: content that flashes more than three times a
    // second is a recognised seizure risk (WCAG 2.3.1, ~333ms), so the banner is not allowed near
    // it. Null means "leave unchanged", so @Min/@Max simply do not apply to a partial update.
    @Min(value = 500, message = "Rotation speed must be at least 500 ms")
    @Max(value = 60000, message = "Rotation speed must be 60000 ms or less")
    private Integer heroRotationMs;

    // --- SMTP, set from the admin panel so no server access is needed ---
    @Size(max = 200) private String mailHost;
    private Integer mailPort;
    @Size(max = 200) private String mailUsername;
    /** Write-only. Blank leaves the stored password untouched; use clearMailPassword to remove it. */
    @Size(max = 400) private String mailPassword;
    private Boolean clearMailPassword;
    @Size(max = 200) private String mailFrom;

    @Size(max = 4000, message = "About us must be 4000 characters or fewer")
    private String aboutUs;

    @Size(max = 500, message = "Confirmation message must be 500 characters or fewer")
    private String orderConfirmMessage;

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

    public boolean isShowFeatureBadges() { return showFeatureBadges; }
    public void setShowFeatureBadges(boolean showFeatureBadges) { this.showFeatureBadges = showFeatureBadges; }

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

    public String getMailHost() { return mailHost; }
    public void setMailHost(String mailHost) { this.mailHost = mailHost; }

    public Integer getMailPort() { return mailPort; }
    public void setMailPort(Integer mailPort) { this.mailPort = mailPort; }

    public String getMailUsername() { return mailUsername; }
    public void setMailUsername(String mailUsername) { this.mailUsername = mailUsername; }

    public String getMailPassword() { return mailPassword; }
    public void setMailPassword(String mailPassword) { this.mailPassword = mailPassword; }

    public Boolean getClearMailPassword() { return clearMailPassword; }
    public void setClearMailPassword(Boolean clearMailPassword) { this.clearMailPassword = clearMailPassword; }

    public String getMailFrom() { return mailFrom; }
    public void setMailFrom(String mailFrom) { this.mailFrom = mailFrom; }

    public String getAboutUs() { return aboutUs; }
    public void setAboutUs(String aboutUs) { this.aboutUs = aboutUs; }

    public String getOrderConfirmMessage() { return orderConfirmMessage; }
    public void setOrderConfirmMessage(String orderConfirmMessage) { this.orderConfirmMessage = orderConfirmMessage; }
}
