package com.leagueline.dto;

import java.time.Instant;

import com.leagueline.model.User;

public record ProfileResponse(
        Long id,
        String fullName,
        String email,
        String role,
        String displayName,
        String bio,
        String organization,
        String phoneNumber,
        Instant createdAt
) {
    public static ProfileResponse from(User user) {
        return new ProfileResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getDisplayName(),
                user.getBio(),
                user.getOrganization(),
                user.getPhoneNumber(),
                user.getCreatedAt()
        );
    }
}