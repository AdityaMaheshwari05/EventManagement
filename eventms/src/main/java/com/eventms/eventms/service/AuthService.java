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
}
