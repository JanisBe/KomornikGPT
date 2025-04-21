package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.user.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private User user;
} 