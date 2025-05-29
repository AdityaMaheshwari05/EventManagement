package com.eventms.eventms.dto;

import com.eventms.eventms.entity.Role;

public record RegisterRequest(String email, String password , Role role) {}