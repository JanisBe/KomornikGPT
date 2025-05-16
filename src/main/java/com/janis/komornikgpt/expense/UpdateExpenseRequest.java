package com.janis.komornikgpt.expense;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record UpdateExpenseRequest(
        Long payerId,
        Long groupId,
        BigDecimal amount,
        Currency currency,
        String description,
        LocalDateTime date,
        List<SplitDto> splits
) {
    public record SplitDto(
            Long userId,
            BigDecimal amountOwed
    ) {
    }
} 