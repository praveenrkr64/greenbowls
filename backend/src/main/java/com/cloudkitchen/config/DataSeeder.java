package com.cloudkitchen.config;

import com.cloudkitchen.entity.*;
import com.cloudkitchen.repository.ApartmentCommunityRepository;
import com.cloudkitchen.repository.MenuItemRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;

/**
 * Seeds a small sample menu + community list so the app is immediately usable
 * in local/dev environments. Only runs on the "local" profile - does NOT run
 * in production, so it never overwrites real menu data.
 */
@Configuration
@Profile("local")
public class DataSeeder {

    @Bean
    CommandLineRunner seed(MenuItemRepository menuItemRepository, ApartmentCommunityRepository communityRepository) {
        return args -> {
            if (menuItemRepository.count() > 0) return;

            // --- Communities ---
            communityRepository.save(community("Green Meadows"));
            communityRepository.save(community("Palm Residency"));
            communityRepository.save(community("Lakeview Towers"));

            // --- Sprouts Bowl ---
            MenuItem sproutsBowl = new MenuItem();
            sproutsBowl.setName("Sprouts Bowl");
            sproutsBowl.setDescription("A protein-packed bowl built around fresh sprouts, your choice of base and toppings.");
            sproutsBowl.setBasePrice(new BigDecimal("120.00"));
            sproutsBowl.setCategory("BOWL");
            sproutsBowl.setSortOrder(1);

            VariantGroup sproutsChoice = group(sproutsBowl, "Choose your sprouts", true, 1, 3, 1);
            option(sproutsChoice, "Moong sprouts", "0.00", 1);
            option(sproutsChoice, "Chana sprouts", "0.00", 2);
            option(sproutsChoice, "Mixed sprouts", "10.00", 3);

            VariantGroup protein = group(sproutsBowl, "Add protein", false, 0, 1, 2);
            option(protein, "Chicken", "40.00", 1);
            option(protein, "Paneer", "30.00", 2);
            option(protein, "Boiled egg", "20.00", 3);

            sproutsBowl.setVariantGroups(java.util.List.of(sproutsChoice, protein));
            menuItemRepository.save(sproutsBowl);

            // --- Chicken Rice Bowl ---
            MenuItem chickenRiceBowl = new MenuItem();
            chickenRiceBowl.setName("Chicken Rice Bowl");
            chickenRiceBowl.setDescription("Grilled chicken over brown or white rice with fresh veggies.");
            chickenRiceBowl.setBasePrice(new BigDecimal("160.00"));
            chickenRiceBowl.setCategory("BOWL");
            chickenRiceBowl.setSortOrder(2);

            VariantGroup riceChoice = group(chickenRiceBowl, "Choose your rice", true, 1, 1, 1);
            option(riceChoice, "Brown rice", "0.00", 1);
            option(riceChoice, "White rice", "0.00", 2);
            option(riceChoice, "Quinoa", "20.00", 3);

            chickenRiceBowl.setVariantGroups(java.util.List.of(riceChoice));
            menuItemRepository.save(chickenRiceBowl);

            // --- Egg Bowl ---
            MenuItem eggBowl = new MenuItem();
            eggBowl.setName("Egg Bowl");
            eggBowl.setDescription("Boiled or scrambled eggs with sauteed veggies and a light dressing.");
            eggBowl.setBasePrice(new BigDecimal("100.00"));
            eggBowl.setCategory("BOWL");
            eggBowl.setSortOrder(3);

            VariantGroup eggStyle = group(eggBowl, "Egg style", true, 1, 1, 1);
            option(eggStyle, "Boiled", "0.00", 1);
            option(eggStyle, "Scrambled", "0.00", 2);

            eggBowl.setVariantGroups(java.util.List.of(eggStyle));
            menuItemRepository.save(eggBowl);

            // --- Detox Drink ---
            MenuItem detoxDrink = new MenuItem();
            detoxDrink.setName("Detox Drink");
            detoxDrink.setDescription("Cold-pressed, no added sugar.");
            detoxDrink.setBasePrice(new BigDecimal("70.00"));
            detoxDrink.setCategory("DRINK");
            detoxDrink.setSortOrder(4);

            VariantGroup flavor = group(detoxDrink, "Choose flavor", true, 1, 1, 1);
            option(flavor, "Cucumber mint", "0.00", 1);
            option(flavor, "Beetroot carrot", "0.00", 2);
            option(flavor, "Lemon ginger", "0.00", 3);

            detoxDrink.setVariantGroups(java.util.List.of(flavor));
            menuItemRepository.save(detoxDrink);
        };
    }

    private ApartmentCommunity community(String name) {
        ApartmentCommunity c = new ApartmentCommunity();
        c.setName(name);
        c.setActive(true);
        return c;
    }

    private VariantGroup group(MenuItem item, String name, boolean required, int min, int max, int sort) {
        VariantGroup g = new VariantGroup();
        g.setMenuItem(item);
        g.setName(name);
        g.setRequired(required);
        g.setMinSelect(min);
        g.setMaxSelect(max);
        g.setSortOrder(sort);
        return g;
    }

    private void option(VariantGroup group, String name, String priceDelta, int sort) {
        VariantOption o = new VariantOption();
        o.setVariantGroup(group);
        o.setName(name);
        o.setPriceDelta(new BigDecimal(priceDelta));
        o.setSortOrder(sort);
        group.getOptions().add(o);
    }
}
