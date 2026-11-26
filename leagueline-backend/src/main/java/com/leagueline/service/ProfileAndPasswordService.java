package com.leagueline.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.leagueline.dto.ChangePasswordRequest;
import com.leagueline.dto.ForgotPasswordRequest;
import com.leagueline.dto.ProfileResponse;
import com.leagueline.dto.ResetPasswordRequest;
import com.leagueline.dto.UpdateProfileRequest;
import com.leagueline.exception.ApiException;
import com.leagueline.model.PasswordResetToken;
import com.leagueline.model.User;
import com.leagueline.repository.PasswordResetTokenRepository;
import com.leagueline.repository.UserRepository;

@Service
public class ProfileAndPasswordService {

    private static final Logger log = LoggerFactory.getLogger(ProfileAndPasswordService.class);
    private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.reset.expose-dev-link:true}")
    private boolean exposeDevLink;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    public ProfileAndPasswordService(
            UserRepository userRepository,
            PasswordResetTokenRepository resetTokenRepository,
            PasswordEncoder passwordEncoder,
            ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSenderProvider = mailSenderProvider;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        return ProfileResponse.from(user);
    }

    @Transactional
    public ProfileResponse updateProfile(String authenticatedEmail, UpdateProfileRequest request) {
        User user = findUserByEmail(authenticatedEmail);

        user.setFullName(request.fullName().trim());
        user.setDisplayName(cleanOptional(request.displayName()));
        user.setBio(cleanOptional(request.bio()));
        user.setOrganization(cleanOptional(request.organization()));
        user.setPhoneNumber(cleanOptional(request.phoneNumber()));

        User saved = userRepository.save(user);
        return ProfileResponse.from(saved);
    }

    @Transactional
    public void changePassword(String authenticatedEmail, ChangePasswordRequest request) {
        User user = findUserByEmail(authenticatedEmail);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password and confirmation do not match.");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password must be different from your current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public Map<String, Object> requestPasswordReset(ForgotPasswordRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "If an account exists for that email, a password reset link has been sent (valid for 15 minutes).");

        if (userOpt.isEmpty()) {
            return response;
        }

        User user = userOpt.get();
        Instant now = Instant.now();

        resetTokenRepository.invalidateActiveTokensForUser(user, now);

        String rawToken = generateSecureToken();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(sha256Hex(rawToken));
        resetToken.setExpiresAt(now.plus(RESET_TOKEN_TTL));
        resetToken.setUsed(false);
        resetTokenRepository.save(resetToken);

        String resetUrl = frontendUrl + "/reset-password?token=" + rawToken;
        log.info("Password reset requested for {}. Reset URL: {}", user.getEmail(), resetUrl);

        sendResetEmail(user.getEmail(), user.getFullName(), resetUrl);

        if (exposeDevLink) {
            response.put("resetUrl", resetUrl);
            response.put("expiresInMinutes", 15);
        }

        return response;
    }

    private void sendResetEmail(String toEmail, String fullName, String resetUrl) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || mailFrom == null || mailFrom.isBlank()) {
            log.warn("MAIL_USERNAME not configured; skipping SMTP email to {}.", toEmail);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(toEmail);
            message.setSubject("LeagueLine — Password Reset Request");
            message.setText(
                    "Hi " + fullName + ",\n\n"
                    + "We received a request to reset your LeagueLine password.\n"
                    + "Click the link below to set a new password (this link expires in 15 minutes and can only be used once):\n\n"
                    + resetUrl + "\n\n"
                    + "If you didn't request this, you can safely ignore this email.\n"
            );
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}: {}", toEmail, ex.getMessage());
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to send reset email right now. Please try again.");
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> validateResetToken(String rawToken) {
        PasswordResetToken token = verifyUsableToken(rawToken);
        return Map.of(
                "valid", true,
                "expiresAt", token.getExpiresAt().toString()
        );
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password and confirmation do not match.");
        }

        PasswordResetToken token = verifyUsableToken(request.token());
        User user = token.getUser();

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password must be different from your current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        token.setUsed(true);
        token.setUsedAt(Instant.now());
        resetTokenRepository.save(token);
    }

    private PasswordResetToken verifyUsableToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid or missing reset token.");
        }

        String hash = sha256Hex(rawToken.trim());
        PasswordResetToken token = resetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "This password reset link is invalid."));

        if (token.isUsed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This password reset link has already been used.");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This password reset link has expired. Please request a new one.");
        }

        return token;
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User account not found."));
    }

    private String cleanOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }
}