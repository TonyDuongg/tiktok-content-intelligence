package com.tiktok.intelligence.service.auth;

import com.tiktok.intelligence.domain.entity.User;
import com.tiktok.intelligence.domain.enums.UserRole;
import com.tiktok.intelligence.dto.request.LoginRequest;
import com.tiktok.intelligence.dto.request.RegisterRequest;
import com.tiktok.intelligence.dto.response.AuthResponse;
import com.tiktok.intelligence.dto.response.UserDto;
import com.tiktok.intelligence.exception.DuplicateResourceException;
import com.tiktok.intelligence.exception.ResourceNotFoundException;
import com.tiktok.intelligence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().toLowerCase().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("Email này đã được sử dụng: " + normalizedEmail);
        }

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .role(UserRole.ROLE_USER)
                .creditsBalance(50)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        Map<String, Object> extraClaims = Map.of(
                "userId", user.getId().toString(),
                "role", user.getRole().name()
        );
        String jwtToken = jwtService.generateToken(extraClaims, userDetails);

        return AuthResponse.of(jwtToken, jwtService.getExpirationTime(), UserDto.fromEntity(user));
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().toLowerCase().trim();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        normalizedEmail,
                        request.password()
                )
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        CustomUserDetails userDetails = new CustomUserDetails(user);
        Map<String, Object> extraClaims = Map.of(
                "userId", user.getId().toString(),
                "role", user.getRole().name()
        );
        String jwtToken = jwtService.generateToken(extraClaims, userDetails);

        return AuthResponse.of(jwtToken, jwtService.getExpirationTime(), UserDto.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + normalizedEmail));
        return UserDto.fromEntity(user);
    }
}
