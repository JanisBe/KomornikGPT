package com.janis.komornikgpt.group;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.janis.komornikgpt.expense.Currency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateGroupRequest(
        @NotBlank(message = "Group name is required") @Size(min = 2, max = 50, message = "Group name must be between 2 and 50 characters") String name,

        @Size(max = 1000, message = "Description must not exceed 1000 characters") String description,
        boolean isPublic,
        @NotNull(message = "Default currency is required") Currency defaultCurrency,
        @NotNull(message = "Members are required") List<MemberRequest> members,
        boolean sendInvitationEmail) {
    public record MemberRequest(
            Long userId,
            @NotBlank(message = "User name is required") String userName,
            String email) {
        @JsonCreator
        public static MemberRequest create(
                @JsonProperty("userId") Long userId,
                @JsonProperty("userName") String userName,
                @JsonProperty("email") String email) {
            return new MemberRequest(userId, userName, email);
        }
    }
}