package com.cloudkitchen.service;

import com.cloudkitchen.dto.SubscriptionRequestCreate;
import com.cloudkitchen.dto.SubscriptionRequestDto;
import com.cloudkitchen.dto.SubscriptionRequestUpdate;
import com.cloudkitchen.entity.SubscriptionRequest;
import com.cloudkitchen.repository.SubscriptionRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class SubscriptionRequestService {

    /** Cadences the customer may ask for. Rejected server-side, not just in the form. */
    private static final Set<String> PLAN_TYPES = Set.of("WEEKLY", "MONTHLY");

    /** The kitchen's worklist states for a request. */
    private static final Set<String> STATUSES = Set.of("NEW", "CONTACTED", "CLOSED");

    private final SubscriptionRequestRepository repository;
    private final EmailNotificationService emailNotificationService;

    public SubscriptionRequestService(SubscriptionRequestRepository repository,
                                      EmailNotificationService emailNotificationService) {
        this.repository = repository;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public SubscriptionRequestDto create(SubscriptionRequestCreate request) {
        String plan = request.getPlanType() == null ? "" : request.getPlanType().trim().toUpperCase();
        if (!PLAN_TYPES.contains(plan)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a weekly or monthly plan");
        }
        SubscriptionRequest entity = new SubscriptionRequest();
        entity.setCustomerName(request.getCustomerName().trim());
        entity.setPhone(request.getPhone().trim());
        entity.setPlanType(plan);
        entity.setStatus("NEW");
        SubscriptionRequest saved = repository.save(entity);
        // Async and best-effort, like the order emails - a mail failure must not lose the request.
        emailNotificationService.notifySubscriptionRequest(
                saved.getCustomerName(), saved.getPhone(), saved.getPlanType());
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionRequestDto> getAllForAdmin() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    /** How many are still waiting for a call - drives the badge on the admin tab. */
    @Transactional(readOnly = true)
    public long pendingCount() {
        return repository.countByStatus("NEW");
    }

    @Transactional
    public SubscriptionRequestDto update(Long id, SubscriptionRequestUpdate request) {
        SubscriptionRequest entity = repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription request not found"));
        if (request.getStatus() != null) {
            String status = request.getStatus().trim().toUpperCase();
            if (!STATUSES.contains(status)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + status);
            }
            entity.setStatus(status);
        }
        // Null means "not sent"; an empty string clears the notes.
        if (request.getNotes() != null) {
            String notes = request.getNotes().trim();
            entity.setNotes(notes.isEmpty() ? null : notes);
        }
        return toDto(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription request not found");
        }
        repository.deleteById(id);
    }

    private SubscriptionRequestDto toDto(SubscriptionRequest s) {
        return new SubscriptionRequestDto(s.getId(), s.getCustomerName(), s.getPhone(),
                s.getPlanType(), s.getStatus(), s.getNotes(), s.getCreatedAt());
    }
}
