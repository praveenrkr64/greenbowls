package com.cloudkitchen.config;

import com.cloudkitchen.entity.Customer;
import com.cloudkitchen.entity.Order;
import com.cloudkitchen.repository.OrderRepository;
import com.cloudkitchen.service.CustomerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Links any order placed before the Customer relation existed to a (found-or-created) customer
 * record, keyed by phone. Runs on every startup - not profile-gated, since real production
 * orders need this too - but does nothing once every order has a customer_id, so it's cheap to
 * leave running indefinitely.
 */
@Configuration
public class CustomerBackfillRunner {

    private static final Logger log = LoggerFactory.getLogger(CustomerBackfillRunner.class);

    @Bean
    CommandLineRunner backfillCustomers(OrderRepository orderRepository, CustomerService customerService) {
        return args -> {
            List<Order> unlinked = orderRepository.findByCustomerIsNull();
            if (unlinked.isEmpty()) {
                return;
            }
            for (Order order : unlinked) {
                Customer customer = customerService.findOrCreate(order.getCustomerName(), order.getCustomerPhone());
                order.setCustomer(customer);
                orderRepository.save(order);
            }
            log.info("Backfilled customer links for {} pre-existing order(s)", unlinked.size());
        };
    }
}
