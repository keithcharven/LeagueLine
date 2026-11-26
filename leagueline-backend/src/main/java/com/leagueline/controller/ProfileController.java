package com.leagueline.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.leagueline.dto.ChangePasswordRequest;
import com.leagueline.dto.ProfileResponse;
import com.leagueline.dto.UpdateProfileRequest;
import com.leagueline.exception.ApiException;
import com.leagueline.service.ProfileAndPasswordService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileAndPasswordService profileService;

    public ProfileController(ProfileAndPasswordService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(profileService.getProfile(authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(authentication.getName(), request));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ProfileResponse> updateProfileById(
            @PathVariable String userId,
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        ProfileResponse current = profileService.getProfile(authentication.getName());
        if (!String.valueOf(current.id()).equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to modify another user's profile.");
        }
        return ResponseEntity.ok(profileService.updateProfile(authentication.getName(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        profileService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
    }
}