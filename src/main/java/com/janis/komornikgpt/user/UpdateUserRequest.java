package com.janis.komornikgpt.user;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String username;
    private String email;
    private String name;
    private String surname;
} 