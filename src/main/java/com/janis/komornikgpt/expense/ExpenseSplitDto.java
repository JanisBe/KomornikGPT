package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.user.UserDto;

import java.math.BigDecimal;

public record ExpenseSplitDto(
    Long id,
    UserDto user,
    BigDecimal amount
) {
    public static ExpenseSplitDto fromExpenseSplit(ExpenseSplit expenseSplit) {
        return new ExpenseSplitDto(
            expenseSplit.getId(),
            UserDto.fromUser(expenseSplit.getUser()),
            expenseSplit.getAmount()
        );
    }
} 