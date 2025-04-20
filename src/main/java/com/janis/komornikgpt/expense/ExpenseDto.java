package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.user.UserDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ExpenseDto(
    Long id,
    UserDto payer,
    BigDecimal amount,
    LocalDateTime date,
    Long groupId,
    List<ExpenseSplitDto> splits
) {
    public static ExpenseDto fromExpense(Expense expense) {
        return new ExpenseDto(
            expense.getId(),
            UserDto.fromUser(expense.getPayer()),
            expense.getAmount(),
            expense.getDate(),
            expense.getGroup().getId(),
            expense.getSplits().stream()
                .map(ExpenseSplitDto::fromExpenseSplit)
                .toList()
        );
    }
} 