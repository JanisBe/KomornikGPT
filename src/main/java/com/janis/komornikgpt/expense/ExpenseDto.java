package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.group.GroupDto;
import com.janis.komornikgpt.user.UserDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ExpenseDto(
    Long id,
    String description,
    BigDecimal amount,
    Currency currency,
    LocalDateTime date,
    UserDto payer,
    GroupDto group,
    List<ExpenseSplitDto> splits,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static ExpenseDto fromExpense(Expense expense) {
        return new ExpenseDto(
            expense.getId(),
                expense.getDescription(),
            expense.getAmount(),
                expense.getCurrency(),
            expense.getDate(),
                UserDto.fromUser(expense.getPayer()),
                GroupDto.fromGroup(expense.getGroup()),
            expense.getSplits().stream()
                .map(ExpenseSplitDto::fromExpenseSplit)
                    .toList(),
                expense.getCreatedAt(),
                expense.getUpdatedAt()
        );
    }

    public record ExpenseSplitDto(
            Long id,
            UserDto user,
            BigDecimal amountOwed,
            boolean isPaid
    ) {
        public static ExpenseSplitDto fromExpenseSplit(ExpenseSplit split) {
            return new ExpenseSplitDto(
                    split.getId(),
                    UserDto.fromUser(split.getUser()),
                    split.getAmountOwed(),
                    split.isPaid()
            );
        }
    }
} 