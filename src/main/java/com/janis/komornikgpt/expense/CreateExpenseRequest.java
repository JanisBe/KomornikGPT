package com.janis.komornikgpt.expense;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CreateExpenseRequest(
        String description,
        BigDecimal amount,
        Currency currency,
        LocalDateTime date,
        Long payerId,
        Long groupId,
        List<ExpenseSplitRequest> splits
) implements SplitContainer {
    public record ExpenseSplitRequest(
            Long userId,
            BigDecimal amountOwed
    ) implements SplitDtoBase {
    }
}
