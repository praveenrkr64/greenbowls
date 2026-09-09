package com.cloudkitchen.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.cloudkitchen.dto.MediaUploadResponse;

// Admin-only: lets the admin upload an image (e.g. the hero image) instead of
// having to host it elsewhere and paste in a URL. Files are saved to app.upload.dir
// and served back publicly from /uploads/** (see WebConfig).
@RestController
@RequestMapping("/api/admin/uploads")
public class MediaUploadController {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    @Value("${app.admin.api-key:1234}")
    private String adminApiKey;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping
    public MediaUploadResponse upload(@RequestParam("file") MultipartFile file,
                                       @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        if (adminApiKey.isBlank() || !adminApiKey.equals(adminKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin key missing or invalid");
        }
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file provided");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, WebP or GIF images are allowed");
        }

        String extension = switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".gif";
        };
        String filename = UUID.randomUUID() + extension;

        try {
            Path targetDir = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(filename);
            file.transferTo(targetFile);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Couldn't save the uploaded file", e);
        }

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/" + filename)
                .toUriString();
        return new MediaUploadResponse(url);
    }
}
