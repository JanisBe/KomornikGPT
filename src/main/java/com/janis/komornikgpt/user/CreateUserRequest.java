package com.janis.komornikgpt.user;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String username;
    private String email;
    private String password;
    private String name;
    private String surname;
} 