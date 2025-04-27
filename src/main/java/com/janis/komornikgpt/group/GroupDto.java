package com.janis.komornikgpt.group;

import com.janis.komornikgpt.user.UserDto;

import java.time.LocalDateTime;
import java.util.List;

public record GroupDto(
    Long id,
    String name,
    String description,
    List<UserDto> members,
    UserDto createdBy,
    LocalDateTime createdAt
) {
    public static GroupDto fromGroup(Group group) {
        return new GroupDto(
            group.getId(),
            group.getName(),
                group.getDescription(),
            group.getUsers().stream()
                .map(UserDto::fromUser)
                    .toList(),
                UserDto.fromUser(group.getCreatedBy()),
                group.getCreatedAt()
        );
    }
} 