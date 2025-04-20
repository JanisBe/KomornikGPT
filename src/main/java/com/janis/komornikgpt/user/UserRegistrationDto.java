// UserRegistrationDto.java - Data transfer object for registration
package com.janis.komornikgpt.user;

import jakarta.validation.constraints.NotBlank;

public record UserRegistrationDto(
    @NotBlank String username,
    @NotBlank String password,
    @NotBlank String email
) {}