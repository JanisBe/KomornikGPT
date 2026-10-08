package com.janis.komornikgpt.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class LoginRequest {
    @JsonAlias({"username", "usernameOrEmail"})
    private String email;
    private String password;
} 