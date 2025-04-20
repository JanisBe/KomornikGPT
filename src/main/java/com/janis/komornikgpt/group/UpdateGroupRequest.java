package com.janis.komornikgpt.group;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateGroupRequest(
    @Size(min = 2, max = 50, message = "Group name must be between 2 and 50 characters")
    String name,
    
    List<Long> userIds
) {} 