package com.janis.komornikgpt.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
        String name,

        @Size(min = 2, max = 50, message = "Surname must be between 2 and 50 characters")
        String surname,

        @Email(message = "Email must be valid")
        String email,

        String currentPassword,

        @Size(min = 4, message = "New password must be at least 4 characters")
        String newPassword
) {
}