package com.janis.komornikgpt.user;

public record UserCreationResult(User user, boolean isNewUser, String verificationToken) {
}
