package com.cloudkitchen.service;

import com.cloudkitchen.dto.DeliveryAgentAdminDto;
import com.cloudkitchen.dto.DeliveryAgentAdminRequest;
import com.cloudkitchen.entity.DeliveryAgent;
import com.cloudkitchen.repository.DeliveryAgentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class DeliveryAgentService {

    private final DeliveryAgentRepository deliveryAgentRepository;

    public DeliveryAgentService(DeliveryAgentRepository deliveryAgentRepository) {
        this.deliveryAgentRepository = deliveryAgentRepository;
    }

    @Transactional(readOnly = true)
    public List<DeliveryAgentAdminDto> getAllAgentsForAdmin() {
        return deliveryAgentRepository.findAllByOrderByNameAsc().stream().map(this::toDto).toList();
    }

    @Transactional
    public DeliveryAgentAdminDto createAgent(DeliveryAgentAdminRequest request) {
        requireUniquePhone(request.getPhone(), null);
        DeliveryAgent agent = new DeliveryAgent();
        applyRequest(agent, request);
        return toDto(deliveryAgentRepository.save(agent));
    }

    @Transactional
    public DeliveryAgentAdminDto updateAgent(Long id, DeliveryAgentAdminRequest request) {
        DeliveryAgent agent = deliveryAgentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery agent not found"));
        requireUniquePhone(request.getPhone(), id);
        applyRequest(agent, request);
        return toDto(deliveryAgentRepository.save(agent));
    }

    // Soft delete: existing orders may reference this agent, so deactivating just takes
    // them out of the "assign" dropdown and their own lookup, without touching order history.
    @Transactional
    public void deactivateAgent(Long id) {
        DeliveryAgent agent = deliveryAgentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery agent not found"));
        agent.setActive(false);
        deliveryAgentRepository.save(agent);
    }

    private void requireUniquePhone(String phone, Long excludingId) {
        deliveryAgentRepository.findByPhone(phone)
                .filter(existing -> excludingId == null || !existing.getId().equals(excludingId))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("A delivery agent with that phone number already exists");
                });
    }

    private void applyRequest(DeliveryAgent agent, DeliveryAgentAdminRequest request) {
        agent.setName(request.getName());
        agent.setPhone(request.getPhone());
        agent.setSecretKey(request.getSecretKey());
        agent.setActive(request.isActive());
    }

    private DeliveryAgentAdminDto toDto(DeliveryAgent agent) {
        return new DeliveryAgentAdminDto(agent.getId(), agent.getName(), agent.getPhone(), agent.getSecretKey(), agent.isActive());
    }
}
