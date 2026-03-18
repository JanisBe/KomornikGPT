package com.janis.komornikgpt.auth;

import com.janis.komornikgpt.user.Role;

public record CurrentUserResponse(
        boolean authenticated,
        Long id,
        String name,
        String email,
        String username,
        Role role
) {
    public static CurrentUserResponse unauthenticated() {
        return new CurrentUserResponse(false, null, null, null, null, null);
    }
}
