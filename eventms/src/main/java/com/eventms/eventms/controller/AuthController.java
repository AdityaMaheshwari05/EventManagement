package com.eventms.eventms.controller;

import com.eventms.eventms.dto.AuthRequest;
import com.eventms.eventms.dto.AuthResponse;
import com.eventms.eventms.dto.RegisterRequest;
import com.eventms.eventms.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:5500", "http://127.0.0.1:5500" }, allowCredentials = "true")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticate(@RequestBody AuthRequest request) {
        System.out.println("Login response: " + authService.authenticate(request));
        return ResponseEntity.ok(authService.authenticate(request));
    }
}