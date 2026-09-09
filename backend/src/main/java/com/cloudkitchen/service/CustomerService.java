package com.cloudkitchen.service;

import com.cloudkitchen.dto.CustomerResponse;
import com.cloudkitchen.entity.Customer;
import com.cloudkitchen.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> listCustomers() {
        return customerRepository.findAll().stream()
                .map(c -> new CustomerResponse(c.getId(), c.getName(), c.getPhone(), c.getOrders().size(), c.getCreatedAt()))
                .sorted(Comparator.comparing(CustomerResponse::createdAt).reversed())
                .toList();
    }

    // Must be called before findOrCreate() for the same phone, since findOrCreate's whole
    // point is to make that phone exist afterward - used to gate the first-order discount.
    @Transactional(readOnly = true)
    public boolean isNewPhone(String phone) {
        return customerRepository.findByPhone(phone).isEmpty();
    }

    /**
     * One customer per phone number. An existing customer's name is refreshed to whatever was
     * given on this order - phone is the stable identity, not the name (people don't change
     * their number, but a typo or a nickname on an earlier order shouldn't stick forever).
     */
    @Transactional
    public Customer findOrCreate(String name, String phone) {
        return customerRepository.findByPhone(phone)
                .map(existing -> {
                    existing.setName(name);
                    return existing;
                })
                .orElseGet(() -> {
                    Customer customer = new Customer();
                    customer.setName(name);
                    customer.setPhone(phone);
                    return customerRepository.save(customer);
                });
    }
}
