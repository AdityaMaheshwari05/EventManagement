package com.eventms.eventms.service;

import com.eventms.eventms.dto.AuthRequest;
import com.eventms.eventms.dto.AuthResponse;
import com.eventms.eventms.dto.RegisterRequest;
import com.eventms.eventms.entity.Role;
import com.eventms.eventms.entity.User;
import com.eventms.eventms.repository.UserRepository;
import com.eventms.eventms.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, JwtService jwtService, AuthenticationManager authenticationManager, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        if (!isValidEmail(request.email())) {
            throw new IllegalArgumentException("Invalid email format");
        }

        // Check if email already exists
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email is already in use");
        }

        // Validate password strength
        if (!isPasswordValid(request.password())) {
            throw new IllegalArgumentException("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
        }


        //Set the default role to USER if not provided
        Role defaultRole = request.role() != null ? request.role() : Role.ATTENDEE;

        //Create new user with default role
        User user = new User(request.email(), passwordEncoder.encode(request.password()), defaultRole);

        //Save the user
        userRepository.save(user);

        //Generate JWT token
        String jwtToken = jwtService.generateToken(user);

        //Return the response with JWT token
        return new AuthResponse(jwtToken, user.getEmail(), user.getRole());
    }

    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        User user = userRepository.findByEmail(request.email()).orElseThrow();
        String jwtToken = jwtService.generateToken(user);
        return new AuthResponse(jwtToken, user.getEmail(), user.getRole());
    }

    private boolean isValidEmail(String email) {
        String regex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        return email != null && email.matches(regex);
    }

    private boolean isPasswordValid(String password) {
        String regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^])[A-Za-z\\d@$!%*?&#^]{8,}$";
        return password != null && password.matches(regex);
    }
}
