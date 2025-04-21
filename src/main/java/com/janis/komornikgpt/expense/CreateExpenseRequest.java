package com.janis.komornikgpt.expense;

import java.math.BigDecimal;
import java.util.List;

public record CreateExpenseRequest(
        Long payerId,
        Long groupId,
        BigDecimal amount,
        Currency currency,
        String description,
        List<SplitDto> splits
) {
    public record SplitDto(
            Long userId,
            BigDecimal amountOwed
    ) {
    }
}
