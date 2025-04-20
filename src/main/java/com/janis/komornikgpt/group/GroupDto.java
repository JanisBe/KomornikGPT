package com.janis.komornikgpt.group;

import com.janis.komornikgpt.user.UserDto;

import java.util.List;

public record GroupDto(
    Long id,
    String name,
    List<UserDto> users
) {
    public static GroupDto fromGroup(Group group) {
        return new GroupDto(
            group.getId(),
            group.getName(),
            group.getUsers().stream()
                .map(UserDto::fromUser)
                .toList()
        );
    }
} 