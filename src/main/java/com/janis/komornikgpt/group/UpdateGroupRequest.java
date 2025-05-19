package com.janis.komornikgpt.group;

import com.janis.komornikgpt.expense.Currency;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateGroupRequest(
        @Size(min = 2, max = 50, message = "Group name must be between 2 and 50 characters") String name,
        String description,
        boolean isPublic,
        @NotNull(message = "Default currency is required") Currency defaultCurrency,
        @NotNull(message = "Members are required") List<MemberRequest> members) {

        public record MemberRequest(
                Long userId,
                @Size(min = 2, max = 50, message = "User name is required") String userName,
                String email) {
        }
}