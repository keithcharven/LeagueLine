package com.leagueline.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Full name is required.")
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters.")
        String fullName,

        @Size(max = 60, message = "Display name / IGN cannot exceed 60 characters.")
        String displayName,

        @Size(max = 300, message = "Bio cannot exceed 300 characters.")
        String bio,

        @Size(max = 100, message = "Organization / school cannot exceed 100 characters.")
        String organization,

        @Pattern(
                regexp = "^$|^\\+?[0-9\\s\\-()]{7,20}$",
                message = "Enter a valid phone number (7–20 digits)."
        )
        String phoneNumber
) {}