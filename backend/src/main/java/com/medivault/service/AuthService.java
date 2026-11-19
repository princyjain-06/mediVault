package com.medivault.service;

import com.medivault.dto.AuthResponse;
import com.medivault.dto.LoginRequest;
import com.medivault.dto.SignUpRequest;
import com.medivault.model.AppUser;
import com.medivault.model.Patient;
import com.medivault.model.enums.UserRole;
import com.medivault.repository.AppUserRepository;
import com.medivault.repository.PatientRepository;
import com.medivault.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepository;
    private final PatientRepository patientRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    /**
     * Register a new user.
     * Creates an AppUser (BCrypt-hashed password) and an empty Patient profile.
     */
    @Transactional
    public AuthResponse signUp(SignUpRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("An account with this email already exists.");
        }

        // Create AppUser with hashed password
        AppUser user = AppUser.builder()
                .email(request.getEmail())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.PATIENT)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        // Create empty Patient profile linked to the new user
        Patient patient = Patient.builder()
                .name(request.getName())
                .user(user)
                .build();
        patientRepository.save(patient);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return toAuthResponse(token, user);
    }

    /**
     * Sign in with email + password.
     */
    public AuthResponse login(LoginRequest request) {
        AppUser user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No account found with that email."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Incorrect password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return toAuthResponse(token, user);
    }

    /** Builds AuthResponse — never includes the password field */
    private AuthResponse toAuthResponse(String token, AppUser user) {
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }
}
