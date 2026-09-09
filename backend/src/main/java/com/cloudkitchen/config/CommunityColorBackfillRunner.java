package com.cloudkitchen.config;

import com.cloudkitchen.entity.ApartmentCommunity;
import com.cloudkitchen.repository.ApartmentCommunityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Assigns a color to any community that predates the color column, cycling through a
 * fixed palette so each gets a visually distinct default until an admin picks their own.
 * Not profile-gated - real production communities need this too - but does nothing once
 * every row has a color, so it's cheap to leave running indefinitely.
 */
@Configuration
public class CommunityColorBackfillRunner {

    private static final Logger log = LoggerFactory.getLogger(CommunityColorBackfillRunner.class);

    private static final String[] PALETTE = {
            "#33562e", // sprout green
            "#e2a63b", // turmeric yellow
            "#a9714a", // clay
            "#3b6ea5", // blue
            "#7a5fa0", // purple
            "#b5486b", // rose
            "#2f8577", // teal
            "#6b6b6b", // gray
    };

    @Bean
    CommandLineRunner backfillCommunityColors(ApartmentCommunityRepository communityRepository) {
        return args -> {
            List<ApartmentCommunity> uncolored = communityRepository.findByColorIsNull();
            if (uncolored.isEmpty()) {
                return;
            }
            for (int i = 0; i < uncolored.size(); i++) {
                uncolored.get(i).setColor(PALETTE[i % PALETTE.length]);
            }
            communityRepository.saveAll(uncolored);
            log.info("Backfilled colors for {} community(ies)", uncolored.size());
        };
    }
}
