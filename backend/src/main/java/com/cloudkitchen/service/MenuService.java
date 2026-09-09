package com.cloudkitchen.service;

import com.cloudkitchen.dto.*;
import com.cloudkitchen.entity.MenuItem;
import com.cloudkitchen.entity.VariantGroup;
import com.cloudkitchen.entity.VariantOption;
import com.cloudkitchen.repository.ApartmentCommunityRepository;
import com.cloudkitchen.repository.MenuItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final ApartmentCommunityRepository communityRepository;

    public MenuService(MenuItemRepository menuItemRepository, ApartmentCommunityRepository communityRepository) {
        this.menuItemRepository = menuItemRepository;
        this.communityRepository = communityRepository;
    }

    // Without this, the Hibernate session backing findByActiveTrueOrderBySortOrderAsc() closes
    // as soon as the repository call returns, and toDto()'s access to the lazy variantGroups/
    // options collections throws LazyInitializationException.
    @Transactional(readOnly = true)
    public List<MenuItemDto> getActiveMenu() {
        return menuItemRepository.findByActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<CommunityDto> getActiveCommunities() {
        return communityRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(c -> new CommunityDto(c.getId(), c.getName()))
                .toList();
    }

    // Admin view: every item including inactive ones, and every option including inactive
    // ones, so the admin can see and re-enable something they previously turned off.
    @Transactional(readOnly = true)
    public List<MenuItemAdminDto> getAllMenuForAdmin() {
        return menuItemRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(this::toAdminDto)
                .toList();
    }

    @Transactional
    public MenuItemAdminDto createItem(MenuItemAdminRequest request) {
        MenuItem item = new MenuItem();
        applyRequest(item, request);
        return toAdminDto(menuItemRepository.save(item));
    }

    @Transactional
    public MenuItemAdminDto updateItem(Long id, MenuItemAdminRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));
        applyRequest(item, request);
        return toAdminDto(menuItemRepository.save(item));
    }

    // Soft delete: past orders keep their own denormalized menuItemName/price snapshot and
    // OrderItem.menuItem is nullable, but a hard delete would still fail on FK constraints
    // for any item that's ever been ordered - and would erase it from order history either way.
    @Transactional
    public void deactivateItem(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));
        item.setActive(false);
        menuItemRepository.save(item);
    }

    // Lightweight update for reordering/"promote to top" within a category - avoids
    // round-tripping the whole variantGroups tree just to move an item up or down.
    @Transactional
    public MenuItemAdminDto updateSortOrder(Long id, int sortOrder) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));
        item.setSortOrder(sortOrder);
        return toAdminDto(menuItemRepository.save(item));
    }

    // Create and update share this: the whole variantGroups/options tree is replaced
    // wholesale from the request every time, relying on cascade=ALL + orphanRemoval=true
    // to delete anything not present in the new list.
    private void applyRequest(MenuItem item, MenuItemAdminRequest request) {
        BigDecimal discountedPrice = request.getDiscountedPrice();
        if (discountedPrice != null) {
            if (discountedPrice.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Discounted price must be greater than zero");
            }
            if (discountedPrice.compareTo(request.getBasePrice()) >= 0) {
                throw new IllegalArgumentException("Discounted price must be less than the actual price");
            }
        }

        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setBasePrice(request.getBasePrice());
        item.setDiscountedPrice(discountedPrice);
        item.setCategory(request.getCategory());
        item.setImageUrl(request.getImageUrl());
        item.setActive(request.isActive());
        item.setSortOrder(request.getSortOrder());

        item.getVariantGroups().clear();
        for (MenuItemAdminRequest.VariantGroupRequest groupReq : request.getVariantGroups()) {
            VariantGroup group = new VariantGroup();
            group.setMenuItem(item);
            group.setName(groupReq.getName());
            group.setRequired(groupReq.isRequired());
            group.setMinSelect(groupReq.getMinSelect());
            group.setMaxSelect(groupReq.getMaxSelect());
            group.setSortOrder(groupReq.getSortOrder());
            for (MenuItemAdminRequest.VariantOptionRequest optReq : groupReq.getOptions()) {
                VariantOption option = new VariantOption();
                option.setVariantGroup(group);
                option.setName(optReq.getName());
                option.setPriceDelta(optReq.getPriceDelta());
                option.setActive(optReq.isActive());
                option.setSortOrder(optReq.getSortOrder());
                group.getOptions().add(option);
            }
            item.getVariantGroups().add(group);
        }
    }

    private MenuItemAdminDto toAdminDto(MenuItem item) {
        List<VariantGroupAdminDto> groups = item.getVariantGroups().stream()
                .map(this::toAdminDto)
                .toList();
        return new MenuItemAdminDto(
                item.getId(), item.getName(), item.getDescription(), item.getBasePrice(), item.getDiscountedPrice(),
                item.getCategory(), item.getImageUrl(), item.isActive(), item.getSortOrder(), groups
        );
    }

    private VariantGroupAdminDto toAdminDto(VariantGroup group) {
        List<VariantOptionAdminDto> options = group.getOptions().stream()
                .map(o -> new VariantOptionAdminDto(o.getId(), o.getName(), o.getPriceDelta(), o.isActive(), o.getSortOrder()))
                .toList();
        return new VariantGroupAdminDto(
                group.getId(), group.getName(), group.isRequired(),
                group.getMinSelect(), group.getMaxSelect(), group.getSortOrder(), options
        );
    }

    private MenuItemDto toDto(MenuItem item) {
        List<VariantGroupDto> groups = item.getVariantGroups().stream()
                .map(this::toDto)
                .toList();
        return new MenuItemDto(
                item.getId(), item.getName(), item.getDescription(), item.getBasePrice(), item.getDiscountedPrice(),
                item.getCategory(), item.getImageUrl(), groups
        );
    }

    private VariantGroupDto toDto(VariantGroup group) {
        List<VariantOptionDto> options = group.getOptions().stream()
                .filter(VariantOption::isActive)
                .map(o -> new VariantOptionDto(o.getId(), o.getName(), o.getPriceDelta()))
                .toList();
        return new VariantGroupDto(
                group.getId(), group.getName(), group.isRequired(),
                group.effectiveMinSelect(), group.getMaxSelect(), options
        );
    }
}
