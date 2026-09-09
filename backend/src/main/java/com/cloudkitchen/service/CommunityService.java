package com.cloudkitchen.service;

import com.cloudkitchen.dto.CommunityAdminDto;
import com.cloudkitchen.dto.CommunityAdminRequest;
import com.cloudkitchen.entity.ApartmentCommunity;
import com.cloudkitchen.repository.ApartmentCommunityRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CommunityService {

    private final ApartmentCommunityRepository communityRepository;

    public CommunityService(ApartmentCommunityRepository communityRepository) {
        this.communityRepository = communityRepository;
    }

    @Transactional(readOnly = true)
    public List<CommunityAdminDto> getAllCommunitiesForAdmin() {
        return communityRepository.findAllByOrderByNameAsc().stream().map(this::toDto).toList();
    }

    @Transactional
    public CommunityAdminDto createCommunity(CommunityAdminRequest request) {
        ApartmentCommunity community = new ApartmentCommunity();
        applyRequest(community, request);
        return toDto(communityRepository.save(community));
    }

    @Transactional
    public CommunityAdminDto updateCommunity(Long id, CommunityAdminRequest request) {
        ApartmentCommunity community = communityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Community not found"));
        applyRequest(community, request);
        return toDto(communityRepository.save(community));
    }

    // Soft delete: existing orders hold a required (non-nullable) FK to their community,
    // so a hard delete would fail once any order has been placed there. Deactivating just
    // takes it off the checkout dropdown - "delivery no longer available" - without
    // touching order history.
    @Transactional
    public void deactivateCommunity(Long id) {
        ApartmentCommunity community = communityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Community not found"));
        community.setActive(false);
        communityRepository.save(community);
    }

    private void applyRequest(ApartmentCommunity community, CommunityAdminRequest request) {
        community.setName(request.getName());
        community.setActive(request.isActive());
        community.setColor(request.getColor());
    }

    private CommunityAdminDto toDto(ApartmentCommunity community) {
        return new CommunityAdminDto(community.getId(), community.getName(), community.isActive(), community.getColor());
    }
}
