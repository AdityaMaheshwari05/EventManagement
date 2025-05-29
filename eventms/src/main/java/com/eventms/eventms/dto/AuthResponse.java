package com.eventms.eventms.dto;

import com.eventms.eventms.entity.Role;
import com.eventms.eventms.entity.User;

public record AuthResponse(String token, String email, Role role) {
    public static AuthResponse of(String token, User user) {
        return new AuthResponse(token, user.getEmail(), user.getRole());
    }
}