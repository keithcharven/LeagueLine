package com.leagueline.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.leagueline.dto.ForgotPasswordRequest;
import com.leagueline.dto.ResetPasswordRequest;
import com.leagueline.service.ProfileAndPasswordService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class PasswordRecoveryController {

    private final ProfileAndPasswordService profileService;

    public PasswordRecoveryController(ProfileAndPasswordService profileService) {
        this.profileService = profileService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(profileService.requestPasswordReset(request));
    }

    @GetMapping("/reset-password/validate")
    public ResponseEntity<?> validateToken(@RequestParam("token") String token) {
        return ResponseEntity.ok(profileService.validateResetToken(token));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        profileService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Your password has been reset. You can now sign in with your new password."));
    }
}